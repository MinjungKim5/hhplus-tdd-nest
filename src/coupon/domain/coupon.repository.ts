import { Coupon, CouponIssue } from './coupon';

export interface ICouponRepository {
  getCouponList(): Promise<Coupon[]>;
  getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]>;
  getCouponIssue(couponIssueId: number): Promise<CouponIssue>;
  createCouponIssue(couponId: number, userId: number): Promise<CouponIssue>;
  updateCouponIssueUsed(couponIssueId: number): Promise<void>;
  getIssueCountAndLimit(
    couponId: number,
  ): Promise<{ issued: number; limit: number }>;
  addIssueCount(couponId: number, issued: number): Promise<void>;
}
