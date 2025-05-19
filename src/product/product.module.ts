import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ProductController } from './controller/product.controller';
import {
  ProductRepository,
  ProductRepositoryToken,
} from './infrastructure/product.repository.impl';
import { ProductService } from './application/product.service';
import { RedisCache } from 'src/util/redis/redis.cache';
import {
  ProductRepositoryWithRedis,
  ProductRepositoryWithRedisToken,
} from './infrastructure/product.repository.impl.redis';
import { RedisModule } from 'src/util/redis/redis.module';

@Module({
  imports: [ScheduleModule.forRoot(), RedisModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: ProductRepositoryToken,
      useClass: ProductRepository,
    },
    {
      provide: ProductRepositoryWithRedisToken,
      useClass: ProductRepositoryWithRedis,
    },
    RedisCache,
  ],
  exports: [ProductService],
})
export class ProductModule {}
