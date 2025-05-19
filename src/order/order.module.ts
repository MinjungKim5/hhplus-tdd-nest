import { Module } from '@nestjs/common';
import { OrderController } from './controller/order.controller';
import { ProductModule } from 'src/product/product.module';
import { OrderRepository } from './infrastructure/order.repository.impl';
import { OrderRepositoryToken } from './infrastructure/order.repository.impl';
import { OrderService } from './application/order.service';

@Module({
  imports: [ProductModule],
  providers: [
    {
      provide: OrderRepositoryToken,
      useClass: OrderRepository,
    },
    OrderService,
  ],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
