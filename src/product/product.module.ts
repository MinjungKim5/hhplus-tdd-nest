import { Module } from '@nestjs/common';
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
import { PProductService } from './application/product.service2';

// @Global()
@Module({
  imports: [RedisModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    PProductService,
    {
      provide: ProductRepositoryToken,
      useClass: ProductRepository,
    },
    {
      provide: ProductRepositoryWithRedisToken,
      useClass: ProductRepositoryWithRedis,
    },
  ],
  exports: [
    ProductService,
    PProductService,
    ProductRepositoryToken,
    ProductRepositoryWithRedisToken,
  ],
})
export class ProductModule {}
