import { Global, Module } from '@nestjs/common';
import { RedisCache } from './redis.cache';
import { RedisLock } from './redis.lock';
import { CacheModule } from '@nestjs/cache-manager';
import Redis from 'ioredis';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
      ttl: 60 * 60,
    }),
  ],
  providers: [
    {
      provide: Redis,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        });
      },
    },
    RedisLock,
    RedisCache,
  ],
  exports: [RedisLock, RedisCache, CacheModule],
})
export class RedisModule {}
