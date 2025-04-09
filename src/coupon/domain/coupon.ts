export class Coupon {
  couponId: number;
  couponType: string;
  benefit: number;
  maxDiscount: number;
  minPrice: number;
  dueDate: Date;
}

export class CouponIssue {
  couponIssueId: number;
  userId: number;
  couponId: number;
  createdAt: Date;
}
