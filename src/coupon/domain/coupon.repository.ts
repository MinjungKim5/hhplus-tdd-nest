import { Coupon, CouponIssue } from "./coupon";

export interface ICouponRepository {
  getCouponList(): Promise<Coupon[]>;
  getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]>;
  getCouponIssue(couponIssueId: number): Promise<CouponIssue>;
  claimCoupon(couponId: number, userId: number): Promise<CouponIssue>;
  updateCouponIssueUsed(couponIssueId: number): Promise<void>;
}

