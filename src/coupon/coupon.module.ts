import { Module } from '@nestjs/common';
import { CouponController } from './controller/coupon.controller';

@Module({
  controllers: [CouponController],
})
export class CouponModule {}
