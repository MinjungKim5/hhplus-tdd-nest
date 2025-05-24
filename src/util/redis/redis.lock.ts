import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisLock {
  private readonly redlock: Redlock;

  constructor(private readonly redis: Redis) {
    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 2,
      retryDelay: 50,
      retryJitter: 50,
    });
  }

  async acquireLock(key: string, ttl: number): Promise<Lock | null> {
    try {
      return await this.redlock.acquire([key], ttl);
    } catch (error) {
      return null;
    }
  }

  async releaseLock(lock: Lock): Promise<void> {
    try {
      if (!lock) return;

      // lock이 아직 유효한지 확인
      if (lock.expiration > Date.now()) {
        await lock.release();
      }
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  }
}
