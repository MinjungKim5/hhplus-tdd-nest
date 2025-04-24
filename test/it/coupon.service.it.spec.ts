import { getPrismaClient, cleanupDatabase } from '../prisma.util';
import { CouponService } from '../../src/coupon/application/coupon.service';
import { CouponRepository } from '../../src/coupon/infrastructure/coupon.repository.impl';
import { ICouponRepository } from '../../src/coupon/domain/coupon.repository';
import { PrismaUnitOfWork } from 'src/prisma/prisma.transaction';
import { OrderRepository } from 'src/order/infrastructure/order.repository.impl';
import { ProductRepository } from 'src/product/infrastructure/product.repository.impl';
import { PurchaseRepository } from 'src/purchase/infrastructure/purchase.repository.impl';
import { PointRepository } from 'src/point/infrastructure/point.repository.impl';

describe('CouponService Integration Tests', () => {
  let prisma: any;
  let couponService: CouponService;
  let unitOfWork: PrismaUnitOfWork;

  beforeAll(async () => {
    prisma = getPrismaClient();

    // 레포지토리 인스턴스 생성
    const couponRepository = new CouponRepository(prisma);
    const orderRepository = new OrderRepository(prisma);
    const productRepository = new ProductRepository(prisma);
    const pointRepository = new PointRepository(prisma);
    const purchaseRepository = new PurchaseRepository(prisma);
    // UnitOfWork 인스턴스 생성
    unitOfWork = new PrismaUnitOfWork(
      prisma,
      orderRepository,
      productRepository,
      pointRepository,
      couponRepository,
      purchaseRepository,
    );

    couponService = new CouponService(couponRepository, unitOfWork);
  });

  beforeEach(async () => {
    await cleanupDatabase();

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
          couponType: 'amount',
          benefit: 500,
          maxDiscount: 1000,
          minPrice: 2000,
          dueDate: new Date('2025-12-31'),
        },
        {
          couponId: 2,
          couponType: 'percent',
          benefit: 10,
          maxDiscount: 500,
          minPrice: 1000,
          dueDate: new Date('2025-12-31'),
        },
        {
          couponId: 3,
          couponType: 'percent',
          benefit: 5,
          maxDiscount: 500,
          minPrice: 1000,
          dueDate: new Date('2025-12-31'),
        },
      ],
    });

    await prisma.couponLimit.createMany({
      data: [
        { couponId: 1, limit: 10, issued: 5 },
        { couponId: 2, limit: 5, issued: 5 },
        { couponId: 3, limit: 2, issued: 1 },
      ],
    });

    await prisma.couponIssue.createMany({
      data: [
        { couponIssueId: 1, couponId: 1, userId: 1, used: false },
        { couponIssueId: 2, couponId: 2, userId: 1, used: true },
      ],
    });
  });

  it('발행 가능한 쿠폰 리스트를 조회할 수 있다.', async () => {
    const result = await couponService.getCouponList();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      couponId: 1,
      couponType: 'amount',
      benefit: 500,
      maxDiscount: 1000,
      minPrice: 2000,
      dueDate: new Date('2025-12-31'),
    });
  });

  it('발행량이 제한수량에 다다른 쿠폰은 발행가능한 쿠폰리스트에서 조회되지 않는다.', async () => {
    const result = await couponService.getCouponList();

    expect(result).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ couponId: 2 })]),
    );
  });

  it('쿠폰을 발급받을 수 있다.', async () => {
    await couponService.claimCoupon(3, 1);

    const issuedCoupon = await prisma.couponIssue.findFirst({
      where: { userId: 1, couponId: 3 },
    });

    expect(issuedCoupon).toBeDefined();
    expect(issuedCoupon.used).toBe(false);
  });

  it('선착순 마감된 쿠폰은 발급받을 수 없다.', async () => {
    // given
    const couponId = 3; // 1장만 추가 발급 가능한 쿠폰
    const user2Id = 2;
    const user3Id = 3;

    // when
    // 두 사용자가 동시에 쿠폰 발급 시도
    const claimPromises = [
      couponService.claimCoupon(couponId, user2Id),
      couponService.claimCoupon(couponId, user3Id),
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

    // 3. 실제로 발급된 쿠폰이 1장인지 확인
    const issuedCoupons = await prisma.couponIssue.findMany({
      where: { couponId },
    });
    expect(issuedCoupons).toHaveLength(1);

    // 4. CouponLimit의 issued 값이 정확히 1 증가했는지 확인
    const couponLimit = await prisma.couponLimit.findFirst({
      where: { couponId },
    });
    expect(couponLimit.issued).toBe(2);
  });

  it('쿠폰을 사용처리할 수 있다.', async () => {
    await couponService.useCoupon(1);

    const couponIssue = await prisma.couponIssue.findUnique({
      where: { couponIssueId: 1 },
    });
    expect(couponIssue.used).toBe(true);
  });

  it('유저에게 발행된 쿠폰 리스트를 조회할 수 있다.', async () => {
    const result = await couponService.getCouponIssuesByUserId(1);

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ couponId: 1, used: false }),
        expect.objectContaining({ couponId: 2, used: true }),
      ]),
    );
  });
});
