import { IEvent } from '@nestjs/cqrs';

export class CompletePurchaseEvent implements IEvent {
  constructor(
    public readonly userId: number,
    public readonly productId: number,
    public readonly quantity: number,
    public readonly orderId: number,
    public readonly couponId?: number,
    public readonly finalPrice?: number,
  ) {}
}
