import { EventsHandler } from '@nestjs/cqrs';
import { CompletePurchaseEvent } from 'src/purchase/application/purchase.event';
import { ProductService } from './product.service';

@EventsHandler(CompletePurchaseEvent)
export class CompletePurchaseEventHandler {
  constructor(private readonly productService: ProductService) {}

  async handleCompletePurchaseEvent(event: CompletePurchaseEvent) {
    // 상품 판매량 업데이트
    await this.productService.addProductSales(event.productId, event.quantity);
  }
}
