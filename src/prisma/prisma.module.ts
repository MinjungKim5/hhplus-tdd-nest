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

@Global()
@Module({
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
      provide: PointRepositoryToken,
      useClass: PointRepository,
    },
    {
      provide: CouponRepositoryToken,
      useClass: CouponRepository,
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
    PointRepositoryToken,
    CouponRepositoryToken,
    PurchaseRepositoryToken,
  ],
})
export class PrismaModule {}
