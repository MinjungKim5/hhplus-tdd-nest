import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUnitOfWork } from './prisma.transaction';
import {
  OrderRepository,
  OrderRepositoryToken,
} from '../order/infrastructure/order.repository.impl';
import {
  ProductRepository,
  ProductRepositoryToken,
} from '../product/infrastructure/product.repository.impl';
import {
  PointRepository,
  PointRepositoryToken,
} from '../point/infrastructure/point.repository.impl';
import {
  CouponRepository,
  CouponRepositoryToken,
} from '../coupon/infrastructure/coupon.repository.impl';
import {
  PurchaseRepository,
  PurchaseRepositoryToken,
} from '../purchase/infrastructure/purchase.repository.impl';
import {
  ProductRepositoryWithRedis,
  ProductRepositoryWithRedisToken,
} from 'src/product/infrastructure/product.repository.impl.redis';
import {
  CouponRepositoryWithRedisToken,
  CouponRepositoryWithReids,
} from 'src/coupon/infrastructure/coupon.repository.impl.redis';
import { RedisModule } from 'src/redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    PrismaService,
    PrismaUnitOfWork,
    {
      provide: OrderRepositoryToken,
      useClass: OrderRepository,
    },
    {
      provide: ProductRepositoryToken,
      useClass: ProductRepository,
    },
    {
      provide: ProductRepositoryWithRedisToken,
      useClass: ProductRepositoryWithRedis,
    },
    {
      provide: PointRepositoryToken,
      useClass: PointRepository,
    },
    {
      provide: CouponRepositoryToken,
      useClass: CouponRepository,
    },
    {
      provide: CouponRepositoryWithRedisToken,
      useClass: CouponRepositoryWithReids,
    },
    {
      provide: PurchaseRepositoryToken,
      useClass: PurchaseRepository,
    },
  ],
  exports: [
    PrismaService,
    PrismaUnitOfWork,
    OrderRepositoryToken,
    ProductRepositoryToken,
    ProductRepositoryWithRedisToken,
    PointRepositoryToken,
    CouponRepositoryToken,
    CouponRepositoryWithRedisToken,
    PurchaseRepositoryToken,
  ],
})
export class PrismaModule {}
