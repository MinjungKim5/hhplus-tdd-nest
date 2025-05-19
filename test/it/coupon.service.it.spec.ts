import { getPrismaClient, cleanupDatabase } from '../prisma.util';
import { CouponService } from '../../src/coupon/application/coupon.service';
import { CouponRepository } from '../../src/coupon/infrastructure/coupon.repository.impl';
import { CouponRepositoryWithReids } from 'src/coupon/infrastructure/coupon.repository.impl.redis';
import { PrismaUnitOfWork } from 'src/util/prisma/prisma.transaction';
import { OrderRepository } from 'src/order/infrastructure/order.repository.impl';
import { ProductRepository } from 'src/product/infrastructure/product.repository.impl';
import { PurchaseRepository } from 'src/purchase/infrastructure/purchase.repository.impl';
import { PointRepository } from 'src/point/infrastructure/point.repository.impl';
import { ICouponRepository } from 'src/coupon/domain/coupon.repository';
import { cleanupRedis, setupRedis, teardownRedis } from '../redis.util';
import Redis from 'ioredis';

describe('CouponService Integration Tests', () => {
  let prisma: any;
  let couponService: CouponService;
  let couponRepository: ICouponRepository;
  let unitOfWork: PrismaUnitOfWork;
  let redisClient: Redis;
  let cacheManager: any;

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
    // 레포지토리 인스턴스 생성
    // couponRepository = new CouponRepository(prisma);
    couponRepository = new CouponRepositoryWithReids(prisma, redisClient);
    const orderRepository = new OrderRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    const pointRepository = new PointRepository(prisma);
    const purchaseRepository = new PurchaseRepository(prisma);
    // UnitOfWork 인스턴스 생성
    unitOfWork = new PrismaUnitOfWork(
      prisma,
      orderRepository,
      productRepository,
      couponRepository,
      purchaseRepository,
    );

    couponService = new CouponService(couponRepository, unitOfWork);
  });

  beforeEach(async () => {
    await cleanupDatabase();
    await cleanupRedis();
    // 테스트 데이터 삽입
    await prisma.user.createMany({
      data: [
        {
          userId: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          point: 1000,
        },
        {
          userId: 2,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          point: 500,
        },
        {
          userId: 3,
          name: 'Alice Smith',
          email: '',
          point: 200,
        },
      ],
    });

    await prisma.coupon.createMany({
      data: [
        {
          couponId: 1,
          name: '1번 쿠폰',
          couponType: 'amount',
          benefit: 500,
          maxDiscount: 1000,
          minPrice: 2000,
          dueDate: new Date('2025-12-31'),
        },
        {
          couponId: 2,
          name: '2번 쿠폰',
          couponType: 'percent',
          benefit: 10,
          maxDiscount: 500,
          minPrice: 1000,
          dueDate: new Date('2025-12-31'),
        },
        {
          couponId: 3,
          name: '3번 쿠폰',
          couponType: 'percent',
          benefit: 5,
          maxDiscount: 500,
          minPrice: 1000,
          dueDate: new Date('2025-12-31'),
        },
      ],
    });

    await couponRepository.publishCoupon(1, 5);
    await couponRepository.publishCoupon(2, 2);
    await couponRepository.publishCoupon(3, 1);
  });

  afterAll(async () => {
    await cleanupRedis();
    await teardownRedis();
    await prisma.$disconnect();
  });

  it('발행 가능한 쿠폰 리스트를 조회할 수 있다.', async () => {
    const result = await couponService.getCouponList();

    expect(result).toHaveLength(3);
  });

  it('쿠폰을 발급받을 수 있고, 발급량이 제한수량에 다다른 쿠폰은 더이상 발급가능한 쿠폰리스트에서 조회되지 않는다.', async () => {
    await couponService.claimCoupon(1, 3);

    const issuedCoupon = await prisma.couponIssue.findFirst({
      where: { userId: 1, couponId: 3 },
    });

    expect(issuedCoupon).toBeDefined();
    expect(issuedCoupon.used).toBe(false);

    const couponList = await couponService.getCouponList();
    expect(couponList).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ couponId: 3 })]),
    );
  });

  it('선착순 마감된 쿠폰은 발급받을 수 없다.', async () => {
    // given
    const couponId = 3; // 1장만 발급 가능한 쿠폰
    const user2Id = 2;
    const user3Id = 3;

    // when
    // 두 사용자가 동시에 쿠폰 발급 시도
    const claimPromises = [
      couponService.claimCoupon(user2Id, couponId),
      couponService.claimCoupon(user3Id, couponId),
    ];

    const results = await Promise.allSettled(claimPromises);

    // then
    // 1. 성공한 요청이 하나만 있어야 함
    const successResults = results.filter(
      (result) => result.status === 'fulfilled',
    );
    expect(successResults).toHaveLength(1);

    // 2. 실패한 요청이 하나 있어야 함
    const failedResults = results.filter(
      (result) => result.status === 'rejected',
    );
    expect(failedResults).toHaveLength(1);
    expect(failedResults[0].reason.message).toBe(
      '쿠폰 발급에 실패했습니다. 선착순 마감되었습니다.',
    );
  });

  it('쿠폰을 사용처리할 수 있다.', async () => {
    await couponService.claimCoupon(1, 1);
    await couponService.useCoupon(1, 1);
    const couponIssue = await couponService.getCouponIssue(1, 1);
    expect(couponIssue.used).toBe(true);
  });

  it('유저에게 발행된 쿠폰 리스트를 조회할 수 있다.', async () => {
    await couponService.claimCoupon(1, 1);
    await couponService.claimCoupon(1, 2);
    await couponService.claimCoupon(1, 3);

    const result = await couponService.getCouponIssuesByUserId(1);

    expect(result).toHaveLength(3);
  });
});
