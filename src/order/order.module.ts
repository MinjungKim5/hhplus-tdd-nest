import { Module } from '@nestjs/common';
import { OrderController } from './controller/order.controller';
import { ProductModule } from 'src/product/product.module';
import { OrderRepository } from './infrastructure/order.repository.impl';
import { OrderRepositoryToken } from './infrastructure/order.repository.impl';
import { OrderService } from './application/order.service';
import { CompletePurchaseEventHandler } from './application/order.event.handler';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [ProductModule, CqrsModule],
  providers: [
    {
      provide: OrderRepositoryToken,
      useClass: OrderRepository,
    },
    OrderService,
    CompletePurchaseEventHandler,
  ],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
