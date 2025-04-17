import { getPrismaClient, cleanupDatabase } from '../prisma.util';
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

describe('PurchaseFacade Integration Tests', () => {
  let prisma: any;
  let purchaseFacade: PurchaseFacade;
  let orderService: OrderService;
  let pointService: PointService;
  let productService: ProductService;
  let couponService: CouponService;

  beforeAll(async () => {
    prisma = getPrismaClient();

    // 레포지토리 인스턴스 생성
    const orderRepository = new OrderRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    const pointRepository = new PointRepository(prisma);
    const couponRepository = new CouponRepository(prisma);
    const purchaseRepository = new PurchaseRepository(prisma);

    // 서비스 인스턴스 생성
    orderService = new OrderService(orderRepository, productRepository);
    pointService = new PointService(pointRepository);
    productService = new ProductService(productRepository);
    couponService = new CouponService(couponRepository);

    // Facade 인스턴스 생성
    purchaseFacade = new PurchaseFacade(
      purchaseRepository,
      orderService,
      pointService,
      productService,
      couponService,
    );
  });

  beforeEach(async () => {
    await cleanupDatabase();

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
          couponType: 'amount',
          benefit: 500000,
          maxDiscount: 500000,
          minPrice: 1000000,
          dueDate: new Date('2025-12-31'),
        },
      ],
    });

    // 5. 쿠폰 발급 데이터 삽입
    await prisma.couponIssue.createMany({
      data: [{ couponIssueId: 1, couponId: 1, userId: 1, used: false }],
    });
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
      couponIssueId: 1,
    });

    // then
    // 1. 포인트 차감 확인
    const userPoint = await pointService.getPointByUser(1);
    expect(userPoint).toBe(500000); // 2000000 - (2000000 - 500000(쿠폰할인))

    // 2. 쿠폰 사용 여부 확인
    const couponIssue = await couponService.getCouponIssue(1);
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
    ).rejects.toThrow('포인트가 부족합니다.');
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
});
