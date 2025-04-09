import { Inject } from "@nestjs/common";
import { CouponRepository, CouponRepositoryToken } from "../infrastructure/coupon.repository.impl";
import { Coupon, CouponIssue } from "../domain/coupon";
import { CouponIssueResult } from "./coupon.application.dto";
export class CouponService {
  constructor(
    @Inject(CouponRepositoryToken)
    private readonly couponRepository: CouponRepository,
  ) {}

  async getCouponList(): Promise<Coupon[]> {
    return this.couponRepository.getCouponList();
  }

  async getCouponIssuesByUserId(userId: number): Promise<CouponIssueResult[]> {
    const couponIssues = await this.couponRepository.getCouponIssuesByUserId(userId);
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
    const couponIssue = await this.couponRepository.getCouponIssue(couponIssueId);
    return couponIssue;
  }

  async claimCoupon(couponId: number, userId: number): Promise<CouponIssueResult> {
    const couponIssue = await this.couponRepository.claimCoupon(couponId, userId);
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

