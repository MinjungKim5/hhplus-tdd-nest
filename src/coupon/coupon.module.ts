import { Module } from '@nestjs/common';
import { CouponController } from './interface/controller/coupon.controller';
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
import { ClientKafka } from '@nestjs/microservices';

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
    {
      provide: 'COUPON_KAFKA',
      useFactory: (factory: (groupId: string) => ClientKafka) => {
        return factory('coupon-group');
      },
      inject: ['KAFKA_CONSUMER_FACTORY'],
    },
  ],
  exports: [CouponService],
})
export class CouponModule {}
