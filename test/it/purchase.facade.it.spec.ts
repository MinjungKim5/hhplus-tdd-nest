import { getPrismaClient, cleanupDatabase } from '../prisma.util';
import {
  getRedisClient,
  cleanupRedis,
  teardownRedis,
  setupRedis,
} from '../redis.util';
import { PurchaseFacade } from 'src/purchase/application/purchase.facade';
import { OrderService } from 'src/order/application/order.service';
import { OrderRepository } from 'src/order/infrastructure/order.repository.impl';
import { ProductRepository } from 'src/product/infrastructure/product.repository.impl';
import { PointService } from 'src/point/application/point.service';
import { PointRepository } from 'src/point/infrastructure/point.repository.impl';
import { CouponService } from 'src/coupon/application/coupon.service';
import { CouponRepository } from 'src/coupon/infrastructure/coupon.repository.impl';
import { PurchaseRepository } from 'src/purchase/infrastructure/purchase.repository.impl';
import { ProductService } from 'src/product/application/product.service';
import { OrderStatus } from 'src/order/domain/order';
import { PrismaUnitOfWork } from 'src/util/prisma/prisma.transaction';
import { RedisLock } from 'src/util/redis/redis.lock';
import { UserLock } from 'src/user/infrastructure/user.lock';
import Redis from 'ioredis';
import { RedisCache } from 'src/util/redis/redis.cache';
import { CouponRepositoryWithReids } from 'src/coupon/infrastructure/coupon.repository.impl.redis';
import { ICouponRepository } from 'src/coupon/domain/coupon.repository';

describe('PurchaseFacade Integration Tests', () => {
  let prisma: any;
  let purchaseFacade: PurchaseFacade;
  let orderService: OrderService;
  let pointService: PointService;
  let productService: ProductService;
  let couponRepository: ICouponRepository;
  let couponService: CouponService;
  let unitOfWork: PrismaUnitOfWork;
  let redisClient: Redis;
  let cacheManager: any;
  let redisLock: RedisLock;
  let userLock: UserLock;
  let redisCache: RedisCache;

  beforeAll(async () => {
    prisma = getPrismaClient();
    try {
      const redis = await setupRedis();
      redisClient = redis.redisClient;
      cacheManager = redis.cacheManager;
    } catch (error) {
      console.error('Error setting up Redis:', error);
      throw error;
    }

    // Redis 서비스 인스턴스 생성
    redisLock = new RedisLock(redisClient);
    userLock = new UserLock(redisLock);
    redisCache = new RedisCache(cacheManager);

    // 레포지토리 인스턴스 생성
    const orderRepository = new OrderRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    const pointRepository = new PointRepository(prisma);
    // couponRepository = new CouponRepository(prisma);
    couponRepository = new CouponRepositoryWithReids(prisma, redisClient);
    const purchaseRepository = new PurchaseRepository(prisma);

    // 서비스 인스턴스 생성
    orderService = new OrderService(orderRepository, productRepository);
    pointService = new PointService(pointRepository, userLock); // userLock 주입
    productService = new ProductService(productRepository, redisCache);

    // UnitOfWork 인스턴스 생성
    unitOfWork = new PrismaUnitOfWork(
      prisma,
      orderRepository,
      productRepository,
      couponRepository,
      purchaseRepository,
    );

    couponService = new CouponService(couponRepository, unitOfWork);

    // Facade 인스턴스 생성
    purchaseFacade = new PurchaseFacade(
      unitOfWork,
      orderService,
      pointService,
      productService,
      couponService,
      userLock,
    );
  });

  afterAll(async () => {
    await cleanupRedis();
    await teardownRedis();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase();
    await cleanupRedis();

    // 1. 유저 데이터 삽입
    await prisma.user.createMany({
      data: [
        {
          userId: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          point: 2000000,
        },
        {
          userId: 2,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          point: 500000,
        },
        {
          userId: 3,
          name: 'Alice Smith',
          email: 'alice.smith@example.com',
          point: 9000000,
        },
        {
          userId: 4,
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
          point: 8000000,
        },
        {
          userId: 5,
          name: 'Charlie Brown',
          email: 'charlie.brown@example.com',
          point: 7000000,
        },
      ],
    });

    // 2. 상품 데이터 삽입
    await prisma.product.createMany({
      data: [
        { productId: 1, name: 'RTX4090', category: '컴퓨터', brand: 'NVIDIA' },
        { productId: 2, name: 'RTX4080', category: '컴퓨터', brand: 'NVIDIA' },
      ],
    });

    // 3. 상품 옵션 데이터 삽입
    await prisma.productOption.createMany({
      data: [
        {
          optionId: 1,
          productId: 1,
          optionName: 'ROG',
          price: 2000000,
          stock: 10,
        },
        {
          optionId: 2,
          productId: 1,
          optionName: 'GIGABYTE',
          price: 1800000,
          stock: 1,
        },
        {
          optionId: 3,
          productId: 2,
          optionName: 'MSI',
          price: 1500000,
          stock: 5,
        },
      ],
    });

    // 4. 쿠폰 데이터 삽입
    await prisma.coupon.createMany({
      data: [
        {
          couponId: 1,
          name: '1번 쿠폰',
          couponType: 'amount',
          benefit: 500000,
          maxDiscount: 500000,
          minPrice: 1000000,
          dueDate: new Date('2025-12-31'),
        },
      ],
    });

    // 5. 쿠폰 발행
    await couponRepository.publishCoupon(1, 100);

    // 6. 쿠폰 발급 받기
    await couponService.claimCoupon(1, 1);
  });

  it('주문 건에 대한 결제를 진행한다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 1,
      optionId: 1,
      quantity: 1,
      address: '서울시 강남구',
    });

    // when
    const result = await purchaseFacade.purchaseOrder({
      userId: 1,
      orderId: order.orderId,
      couponId: 1,
    });

    // then
    // 1. 포인트 차감 확인
    const userPoint = await pointService.getPointByUser(1);
    expect(userPoint).toBe(500000); // 2000000 - (2000000 - 500000(쿠폰할인))

    // 2. 쿠폰 사용 여부 확인
    const couponIssue = await couponService.getCouponIssue(1, 1);
    expect(couponIssue.used).toBe(true);

    // 3. 재고 차감 확인
    const productOption = await productService.getProductOption(1);
    expect(productOption.stock).toBe(9);

    // 4. 구매 수량 증가 확인
    const productStat = await prisma.productStat.findFirst({
      where: { productId: 1 },
    });
    expect(productStat.sales).toBe(1);

    // 5. 주문 상태 확인
    const updatedOrder = await orderService.getOrder(order.orderId);
    expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);

    // 6. 결제 건 생성 확인
    expect(result).toBeDefined();
    expect(result.finalPrice).toBe(1500000); // 2000000 - 500000(쿠폰할인)
  });

  it('최종 금액에 비해 포인트가 부족하면 결제에 실패한다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 2, // 500000 포인트 보유
      optionId: 1, // 2000000원 상품
      quantity: 1,
      address: '서울시 강남구',
    });

    // when & then
    await expect(
      purchaseFacade.purchaseOrder({
        userId: 2,
        orderId: order.orderId,
      }),
    ).rejects.toThrow('잔액이 부족합니다.');
  });

  it('재고가 부족하면 결제에 실패한다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 1,
      optionId: 2, // 재고 1개
      quantity: 1,
      address: '서울시 강남구',
    });

    await prisma.productOption.update({
      where: { optionId: 2 },
      data: { stock: 0 }, // 재고를 0으로 설정
    });

    // when & then
    await expect(
      purchaseFacade.purchaseOrder({
        userId: 1,
        orderId: order.orderId,
      }),
    ).rejects.toThrow('재고가 부족합니다.');
  });

  it('동시에 들어온 구매 요청의 총합이 재고를 초과하면 실패한다.', async () => {
    // given
    // 3개의 주문을 생성 (각각 2개씩 구매 시도, 총 필요 수량 6개)
    const orders = await Promise.all([
      orderService.makeOrder({
        userId: 3,
        optionId: 3,
        quantity: 2,
        address: '서울시 강남구',
      }),
      orderService.makeOrder({
        userId: 4,
        optionId: 3,
        quantity: 2,
        address: '서울시 강남구',
      }),
      orderService.makeOrder({
        userId: 5,
        optionId: 3,
        quantity: 2,
        address: '서울시 강남구',
      }),
    ]);

    await prisma.productOption.update({
      where: { optionId: 3 },
      data: { stock: 5 }, // 재고를 5개로 설정
    });

    // when
    const purchasePromises = orders.map((order) =>
      purchaseFacade
        .purchaseOrder({
          userId: order.userId,
          orderId: order.orderId,
        })
        .catch((error) => error),
    );

    const results = await Promise.all(purchasePromises);

    // then
    // 1. 성공한 구매는 2건이어야 함
    const successCount = results.filter(
      (result) => !(result instanceof Error),
    ).length;
    expect(successCount).toBe(2);

    // 2. 실패한 구매는 1건이어야 함 (재고 부족)
    const failCount = results.filter(
      (result) =>
        result instanceof Error && result.message === '재고가 부족합니다.',
    ).length;
    expect(failCount).toBe(1);

    // 3. 최종 재고는 1개여야 함
    const finalStock = await productService.getProductOption(3);
    expect(finalStock.stock).toBe(1);

    // 4. 총 판매량은 4개여야 함 (2개씩 2건 성공)
    const productStat = await prisma.productStat.findFirst({
      where: { productId: 2 },
    });
    expect(productStat.sales).toBe(4);
  });

  describe('분산 락 테스트', () => {
    it('동시에 들어온 포인트 차감 요청이 분산락으로 인해 순차적으로 처리된다', async () => {
      // given
      await prisma.user.update({
        where: { userId: 1 },
        data: { point: 4000000 },
      });

      const orders = await Promise.all([
        orderService.makeOrder({
          userId: 1,
          optionId: 1,
          quantity: 1,
          address: '서울시 강남구',
        }),
        orderService.makeOrder({
          userId: 1,
          optionId: 1,
          quantity: 1,
          address: '서울시 강남구',
        }),
      ]);

      // when
      const purchasePromises = orders.map((order) =>
        purchaseFacade.purchaseOrder({
          userId: 1,
          orderId: order.orderId,
        }),
      );

      const results = await Promise.all(purchasePromises);

      // then
      // 두 개의 결제 요청이 모두 성공했는지 확인
      expect(results).toHaveLength(2);

      // 포인트가 정확히 차감되었는지 확인
      const finalPoint = await pointService.getPointByUser(1);
      expect(finalPoint).toBe(0);

      // 재고가 정확히 차감되었는지 확인
      const productOption = await productService.getProductOption(1);
      expect(productOption.stock).toBe(8);

      // 주문 상태가 모두 완료인지 확인
      const orderStatuses = await Promise.all(
        orders.map((order) => orderService.getOrder(order.orderId)),
      );
      orderStatuses.forEach((order) => {
        expect(order.status).toBe(OrderStatus.COMPLETED);
      });
    });

    it('분산락 획득 실패 시 결제에 실패한다', async () => {
      // given
      const order = await orderService.makeOrder({
        userId: 1,
        optionId: 1,
        quantity: 1,
        address: '서울시 강남구',
      });

      // 첫 번째 락 획득
      const firstLock = await userLock.acquireUserLock(1);
      expect(firstLock).toBeDefined();

      // when & then
      await expect(
        purchaseFacade.purchaseOrder({
          userId: 1,
          orderId: order.orderId,
        }),
      ).rejects.toThrow('유저가 다른 작업을 진행중입니다');

      // 락 해제
      await userLock.releaseUserLock(firstLock);
    });

    it('락이 해제되면 다시 결제를 시도할 수 있다', async () => {
      // given
      const order = await orderService.makeOrder({
        userId: 1,
        optionId: 1,
        quantity: 1,
        address: '서울시 강남구',
      });

      // 첫 번째 락 획득
      const lock = await userLock.acquireUserLock(1);

      // when
      const purchasePromise = purchaseFacade.purchaseOrder({
        userId: 1,
        orderId: order.orderId,
      });

      // then
      await expect(purchasePromise).rejects.toThrow(
        '유저가 다른 작업을 진행중입니다',
      );

      // 락 해제 후 재시도
      await userLock.releaseUserLock(lock);
      const result = await purchaseFacade.purchaseOrder({
        userId: 1,
        orderId: order.orderId,
      });

      expect(result).toBeDefined();
      const finalPoint = await pointService.getPointByUser(1);
      expect(finalPoint).toBe(0);
    });
  });
});
