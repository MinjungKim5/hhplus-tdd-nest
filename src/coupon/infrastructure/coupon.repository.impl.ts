import { Inject } from "@nestjs/common";
import { ICouponRepository } from "../domain/coupon.repository";
import { Coupon, CouponIssue } from "../domain/coupon";

export const CouponRepositoryToken = Symbol('CouponRepository');

export class CouponRepository implements ICouponRepository {
  constructor(
    @Inject(CouponRepositoryToken) private readonly couponRepository: ICouponRepository,
  ) {}

  getCouponList(): Promise<Coupon[]> {
    return null;
  }

  getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]> {
    return null;
  }

  getCouponIssue(couponIssueId: number): Promise<CouponIssue> {
    return null;
  }

  claimCoupon(couponId: number, userId: number): Promise<CouponIssue> {
    return null;
  }

  updateCouponIssueUsed(couponIssueId: number): Promise<void> {
    return
  }
}
