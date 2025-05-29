import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { OrderService } from '../application/order.service';
import { OrderStatus } from '../domain/order';

@Injectable()
export class OrderKafkaConsumer implements OnModuleInit {
  constructor(
    @Inject('ORDER_KAFKA') private readonly kafka: ClientKafka,
    private readonly orderService: OrderService,
  ) {}

  async onModuleInit() {
    this.kafka.subscribeToResponseOf('purchase.completed');
    await this.kafka.connect();
  }

  @MessagePattern('purchase.completed')
  async handlePurchaseCompleted(data: any) {
    const event = JSON.parse(data.value);
    await this.orderService.updateOrderStatus(
      event.orderId,
      OrderStatus.COMPLETED,
    );
  }
}
