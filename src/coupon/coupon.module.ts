import { Module } from '@nestjs/common';
import { CouponController } from './controller/coupon.controller';
import {
  CouponRepository,
  CouponRepositoryToken,
} from './infrastructure/coupon.repository.impl';
import { CouponService } from './application/coupon.service';
import { RedisModule } from 'src/util/redis/redis.module';
import {
  CouponRepositoryWithRedisToken,
  CouponRepositoryWithReids,
} from './infrastructure/coupon.repository.impl.redis';

@Module({
  imports: [RedisModule],
  controllers: [CouponController],
  providers: [
    CouponService,
    {
      provide: CouponRepositoryToken,
      useClass: CouponRepository,
    },
    {
      provide: CouponRepositoryWithRedisToken,
      useClass: CouponRepositoryWithReids,
    },
  ],
  exports: [CouponService],
})
export class CouponModule {}
