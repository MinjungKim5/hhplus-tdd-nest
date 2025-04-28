import { Injectable, OnModuleDestroy } from '@nestjs/common';
import IORedis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: IORedis;
  private readonly redlock: Redlock;

  constructor() {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redlock = new Redlock([this.redis], {
      // 락 획득 재시도 설정
      driftFactor: 0.01, // 시계 드리프트 허용 범위
      retryCount: 10, // 최대 재시도 횟수
      retryDelay: 200, // 재시도 간격 (ms)
      retryJitter: 200, // 재시도 간격 변동 범위
    });

    // 락 획득/해제 이벤트 리스너
    this.redlock.on('error', (error) => {
      console.error('Redlock error:', error);
    });
  }

  async acquireLock(key: string, ttl: number): Promise<Lock | null> {
    try {
      // ttl은 밀리초 단위
      const lock = await this.redlock.acquire([`locks:${key}`], ttl);
      return lock;
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      return null;
    }
  }

  async releaseLock(lock: Lock): Promise<void> {
    try {
      await lock.release();
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  }

  // 모듈 종료 시 연결 정리
  async onModuleDestroy() {
    await this.redis.quit();
  }

  // 캐시 관련 메서드 추가
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'PX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
