import { getPrismaClient, cleanupDatabase } from '../prisma.util';
import { CouponService } from '../../src/coupon/application/coupon.service';
import { CouponRepository } from '../../src/coupon/infrastructure/coupon.repository.impl';
import { ICouponRepository } from '../../src/coupon/domain/coupon.repository';

describe('CouponService Integration Tests', () => {
  let prisma: any;
  let couponRepository: ICouponRepository;
  let couponService: CouponService;

  beforeAll(async () => {
    prisma = getPrismaClient();
    // CouponRepository에 자기 자신을 주입
    const selfRepository = {} as ICouponRepository;
    couponRepository = new CouponRepository(prisma);
    Object.assign(selfRepository, couponRepository); // 자기 참조 설정

    couponService = new CouponService(couponRepository);
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
      ],
    });

    await prisma.couponLimit.createMany({
      data: [
        { couponId: 1, limit: 10, issued: 5 },
        { couponId: 2, limit: 5, issued: 5 },
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

    expect(result).toHaveLength(1);
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
    await couponService.claimCoupon(1, 1);

    const issuedCoupon = await prisma.couponIssue.findFirst({
      where: { userId: 1, couponId: 1 },
    });

    expect(issuedCoupon).toBeDefined();
    expect(issuedCoupon.used).toBe(false);
  });

  it('선착순 마감된 쿠폰은 발급받을 수 없다.', async () => {
    await expect(couponService.claimCoupon(2, 2)).rejects.toThrow(
      '선착순이 마감되었습니다.',
    );
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
