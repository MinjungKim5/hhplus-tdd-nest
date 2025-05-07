import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ProductController } from './controller/product.controller';
import {
  ProductRepository,
  ProductRepositoryToken,
} from './infrastructure/product.repository.impl';
import { ProductService } from './application/product.service';
import { RedisCache } from 'src/redis/redis.cache';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: ProductRepositoryToken,
      useClass: ProductRepository,
    },
    RedisCache,
  ],
  exports: [ProductService],
})
export class ProductModule {}
