import { Module } from '@nestjs/common';
import { PurchaseController } from './controller/purchase.controller';
import {
  PurchaseRepository,
  PurchaseRepositoryToken,
} from './infrastructure/purchase.repository.impl';
import { PurchaseService } from './domain/purchase.service';
import { OrderModule } from 'src/order/order.module';
import { PointModule } from 'src/point/point.module';
import { ProductModule } from 'src/product/product.module';
import { CouponModule } from 'src/coupon/coupon.module';
import { UserModule } from 'src/user/user.module';
import { PurchaseFacade } from './application/purchase.facade';
import { PrismaUnitOfWork } from 'src/util/prisma/prisma.transaction';
@Module({
  imports: [OrderModule, PointModule, ProductModule, CouponModule, UserModule],
  controllers: [PurchaseController],
  providers: [
    PurchaseService,
    PurchaseFacade,
    PrismaUnitOfWork,
    { provide: PurchaseRepositoryToken, useClass: PurchaseRepository },
  ],
  exports: [PurchaseService, PurchaseFacade, PurchaseRepositoryToken],
})
export class PurchaseModule {}
