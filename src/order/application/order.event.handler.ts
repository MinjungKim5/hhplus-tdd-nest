import { EventsHandler } from '@nestjs/cqrs';
import { CompletePurchaseEvent } from 'src/purchase/application/purchase.event';
import { OrderService } from './order.service';
import { OrderStatus } from '../domain/order';

@EventsHandler(CompletePurchaseEvent)
export class CompletePurchaseEventHandler {
  constructor(private readonly orderService: OrderService) {}

  async handleCompletePurchaseEvent(event: CompletePurchaseEvent) {
    // 상품 재고 업데이트
    await this.orderService.updateOrderStatus(
      event.orderId,
      OrderStatus.COMPLETED,
    );
  }
}
