import { Module } from '@nestjs/common';
import { PurchaseController } from './controller/purchase.controller';
import { PurchaseRepository, PurchaseRepositoryToken } from './infrastructure/purchase.repository.impl';
import { PurchaseService } from './domain/purchase.service';
import { OrderModule } from 'src/order/order.module';
import { PointModule } from 'src/point/point.module';
import { ProductModule } from 'src/product/product.module';
import { CouponModule } from 'src/coupon/coupon.module';
import { UserModule } from 'src/user/user.module';
@Module({
  imports: [ProductModule, PointModule, OrderModule, CouponModule, UserModule],
  controllers: [PurchaseController],
  providers: [PurchaseService, { provide: PurchaseRepositoryToken, useClass: PurchaseRepository }],
})
export class PurchaseModule {}
