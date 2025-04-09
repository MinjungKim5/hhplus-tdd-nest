import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PointModule } from './point/point.module';
import { CouponModule } from './coupon/coupon.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [PointModule, CouponModule, OrderModule, ProductModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
