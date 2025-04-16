import { Coupon, CouponIssue } from './coupon';

export interface ICouponRepository {
  getCouponList(): Promise<Coupon[]>;
  getCouponIssuesByUserId(userId: number): Promise<CouponIssue[]>;
  getCouponIssue(couponIssueId: number): Promise<CouponIssue>;
  createCouponIssue(couponId: number, userId: number): Promise<CouponIssue>;
  updateCouponIssueUsed(couponIssueId: number): Promise<void>;
  isOnIssue(couponId: number): Promise<boolean>;
  addIssueCount(couponId: number): Promise<void>;
}
