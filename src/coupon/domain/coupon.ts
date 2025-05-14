export class Coupon {
  couponId: number;
  name: string;
  couponType: string;
  benefit: number;
  maxDiscount: number;
  minPrice: number;
  dueDate: Date;
}

export class CouponIssue extends Coupon {
  userId: number;
  createdAt: Date;
  used: boolean;
}
