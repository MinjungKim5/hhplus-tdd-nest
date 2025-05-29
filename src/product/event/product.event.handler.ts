import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { CompletePurchaseEvent } from 'src/purchase/event/purchase.event';
import { ProductService } from '../application/product.service';

@Injectable()
export class ProductKafkaConsumer implements OnModuleInit {
  constructor(
    @Inject('PRODUCT_KAFKA') private readonly kafka: ClientKafka,
    private readonly productService: ProductService,
  ) {}

  async onModuleInit() {
    this.kafka.subscribeToResponseOf('purchase.completed');
    await this.kafka.connect();
  }

  @MessagePattern('purchase.completed')
  async handlePurchaseCompleted(data: any) {
    const event = JSON.parse(data.value);
    // 상품 판매량 업데이트
    await this.productService.addProductSales(event.productId, event.quantity);
  }
}
