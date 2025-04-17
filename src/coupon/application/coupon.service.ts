import { Inject } from '@nestjs/common';
import { CouponRepositoryToken } from '../infrastructure/coupon.repository.impl';
import { Coupon, CouponIssue } from '../domain/coupon';
import { CouponIssueResult } from './coupon.application.dto';
import { ICouponRepository } from '../domain/coupon.repository';
export class CouponService {
  constructor(
    @Inject(CouponRepositoryToken)
    private readonly couponRepository: ICouponRepository,
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

  async getCouponIssue(couponIssueId: number): Promise<CouponIssue> {
    const couponIssue =
      await this.couponRepository.getCouponIssue(couponIssueId);
    return couponIssue;
  }

  async claimCoupon(
    couponId: number,
    userId: number,
  ): Promise<CouponIssueResult> {
    const isOnIssue = await this.couponRepository.isOnIssue(couponId);
    if (!isOnIssue) throw new Error('선착순이 마감되었습니다.');
    await this.couponRepository.addIssueCount(couponId);
    const couponIssue = await this.couponRepository.createCouponIssue(
      couponId,
      userId,
    );
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
  }

  async useCoupon(couponIssueId: number): Promise<void> {
    await this.couponRepository.updateCouponIssueUsed(couponIssueId);
  }
}
