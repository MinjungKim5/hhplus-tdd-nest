import { Coupon, CouponIssue } from './coupon';

export interface ICouponRepository {
  publishCoupon(couponId: number, limit: number): Promise<void>;
  getCouponList(): Promise<Coupon[]>;
  getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]>;
  getCouponIssue(userId: number, couponId: number): Promise<CouponIssue>;
  createCouponIssue(userId: number, couponId: number): Promise<CouponIssue>;
  updateCouponIssueUsed(userId: number, couponId): Promise<void>;
  getIssueCountAndLimit(
    couponId: number,
  ): Promise<{ issued: number; limit: number }>;
  addIssueCount(couponId: number, issued: number): Promise<void>;
}
