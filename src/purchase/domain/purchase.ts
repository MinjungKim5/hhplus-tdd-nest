export class Purchase {
  id: number;
  userId: number;
  orderId: number;
  couponId?: number;
  finalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: number,
    userId: number,
    orderId: number,
    couponId: number | undefined,
    finalPrice: number,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.orderId = orderId;
    this.couponId = couponId;
    this.finalPrice = finalPrice;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export class CreatePurchaseDto {
  userId: number;
  orderId: number;
  couponId?: number;
  finalPrice: number;
  status: string;
}
