import { Inject } from '@nestjs/common';
import { CouponRepositoryToken } from '../infrastructure/coupon.repository.impl';
import { Coupon, CouponIssue } from '../domain/coupon';
import { CouponIssueResult } from './coupon.application.dto';
import { ICouponRepository } from '../domain/coupon.repository';
import { IRepositoryContext } from 'src/common/unit-of-work';
import { PrismaUnitOfWork } from 'src/prisma/prisma.transaction';
import { CouponRepositoryWithRedisToken } from '../infrastructure/coupon.repository.impl.redis';
export class CouponService {
  constructor(
    @Inject(CouponRepositoryWithRedisToken)
    private readonly couponRepository: ICouponRepository,
    private readonly unitOfWork: PrismaUnitOfWork,
  ) {}

  async getCouponList(): Promise<Coupon[]> {
    return this.couponRepository.getCouponList();
  }

  async getCouponIssuesByUserId(userId: number): Promise<CouponIssueResult[]> {
    const couponIssues =
      await this.couponRepository.getCouponIssuesByUserId(userId);
    return couponIssues.map((couponIssue) => ({
      couponId: couponIssue.couponId,
      couponType: couponIssue.couponType,
      benefit: couponIssue.benefit,
      maxDiscount: couponIssue.maxDiscount,
      minPrice: couponIssue.minPrice,
      dueDate: couponIssue.dueDate,
      used: couponIssue.used,
      createdAt: couponIssue.createdAt,
    }));
  }

  async getCouponIssue(userId: number, couponId: number): Promise<CouponIssue> {
    const couponIssue = await this.couponRepository.getCouponIssue(
      userId,
      couponId,
    );
    return couponIssue;
  }

  async claimCoupon(
    userId: number,
    couponId: number,
  ): Promise<CouponIssueResult> {
    return await this.claimCouponWithTransaction(userId, couponId);
  }

  async claimCouponWithTransaction(
    userId: number,
    couponId: number,
  ): Promise<CouponIssueResult> {
    return this.unitOfWork.runInTransaction(async (ctx) => {
      const { issued, limit } =
        await ctx.couponRepository.getIssueCountAndLimit(couponId);
      if (issued >= limit) {
        throw new Error('쿠폰 발급에 실패했습니다. 선착순 마감되었습니다.');
      }

      const couponIssue = await ctx.couponRepository.createCouponIssue(
        userId,
        couponId,
      );

      await ctx.couponRepository.addIssueCount(couponId, issued);

      return {
        couponId: couponIssue.couponId,
        couponType: couponIssue.couponType,
        benefit: couponIssue.benefit,
        maxDiscount: couponIssue.maxDiscount,
        minPrice: couponIssue.minPrice,
        dueDate: couponIssue.dueDate,
        used: couponIssue.used,
        createdAt: couponIssue.createdAt,
      };
    });
  }

  async useCoupon(userId: number, couponId: number): Promise<void> {
    await this.couponRepository.updateCouponIssueUsed(userId, couponId);
  }

  async applyCoupon(
    price: number,
    userId: number,
    couponId: number,
  ): Promise<number> {
    const couponIssue = await this.couponRepository.getCouponIssue(
      userId,
      couponId,
    );
    if (couponIssue.used === true) {
      throw new Error('이미 사용된 쿠폰입니다.');
    }
    if (couponIssue.dueDate < new Date()) {
      throw new Error('쿠폰이 만료되었습니다.');
    }
    if (price < couponIssue.minPrice) {
      throw new Error('최소 사용 금액에 미달합니다.');
    }
    if (couponIssue.couponType === 'percent') {
      const discount = Math.floor(price * (couponIssue.benefit / 100));
      return price - Math.min(discount, couponIssue.maxDiscount);
    } else if (couponIssue.couponType === 'fixed') {
      return price - Math.min(couponIssue.benefit, couponIssue.maxDiscount);
    } else {
      throw new Error('유효하지 않은 쿠폰입니다.');
    }
  }

  async applyCouponWithTransaction(
    ctx: IRepositoryContext,
    price: number,
    userId: number,
    couponId: number,
  ): Promise<number> {
    const couponIssue = await ctx.couponRepository.getCouponIssue(
      userId,
      couponId,
    );
    if (couponIssue.used) throw new Error('이미 사용된 쿠폰입니다.');
    if (couponIssue.dueDate < new Date())
      throw new Error('쿠폰이 만료되었습니다.');
    if (price < couponIssue.minPrice)
      throw new Error('최소 사용 금액에 미달합니다.');

    return this.calculateDiscount(price, couponIssue);
  }

  async useCouponWithTransaction(
    ctx: IRepositoryContext,
    userId: number,
    couponId: number,
  ): Promise<void> {
    await ctx.couponRepository.updateCouponIssueUsed(userId, couponId);
  }

  private calculateDiscount(price: number, couponIssue: CouponIssue): number {
    if (couponIssue.couponType === 'percent') {
      const discount = Math.floor(price * (couponIssue.benefit / 100));
      return price - Math.min(discount, couponIssue.maxDiscount);
    }
    if (couponIssue.couponType === 'amount') {
      return price - Math.min(couponIssue.benefit, couponIssue.maxDiscount);
    }
  }
}
