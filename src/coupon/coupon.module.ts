import { Module } from '@nestjs/common';
import { CouponController } from './controller/coupon.controller';
import {
  CouponRepository,
  CouponRepositoryToken,
} from './infrastructure/coupon.repository.impl';
import { CouponService } from './application/coupon.service';

@Module({
  controllers: [CouponController],
  providers: [
    CouponService,
    {
      provide: CouponRepositoryToken,
      useClass: CouponRepository,
    },
  ],
})
export class CouponModule {}
