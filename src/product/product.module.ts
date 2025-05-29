import { Module } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
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
import { KafkaModule } from 'src/util/kafka/kafka.module';
import { ProductKafkaConsumer } from './event/product.event.handler';

// @Global()
@Module({
  imports: [RedisModule, KafkaModule],
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
    {
      provide: 'PRODUCT_KAFKA',
      useFactory: (factory: (groupId: string) => ClientKafka) => {
        return factory('product-group');
      },
      inject: ['KAFKA_CONSUMER_FACTORY'],
    },
    ProductKafkaConsumer,
  ],
  exports: [
    ProductService,
    PProductService,
    ProductRepositoryToken,
    ProductRepositoryWithRedisToken,
  ],
})
export class ProductModule {}
