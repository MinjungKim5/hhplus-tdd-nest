import { Module } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { OrderController } from './controller/order.controller';
import { ProductModule } from 'src/product/product.module';
import {
  OrderRepository,
  OrderRepositoryToken,
} from './infrastructure/order.repository.impl';
import { OrderService } from './application/order.service';
import { KafkaModule } from 'src/util/kafka/kafka.module';
import { OrderKafkaConsumer } from './event/order.event.handler';

@Module({
  imports: [ProductModule, KafkaModule],
  providers: [
    {
      provide: OrderRepositoryToken,
      useClass: OrderRepository,
    },
    OrderService,
    {
      provide: 'ORDER_KAFKA',
      useFactory: (factory: (groupId: string) => ClientKafka) => {
        return factory('order-group');
      },
      inject: ['KAFKA_CONSUMER_FACTORY'],
    },
    OrderKafkaConsumer,
  ],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
