export class Coupon {
  couponId: number;
  couponType: string;
  benefit: number;
  maxDiscount: number;
  minPrice: number;
  dueDate: Date;
}

export class CouponIssue extends Coupon {
  couponIssueId: number;
  userId: number;
  createdAt: Date;
  used: boolean;
}
