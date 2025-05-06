import { Injectable } from '@nestjs/common';
import { RedisLock } from 'src/redis/redis.lock';
import { Lock } from 'redlock';
@Injectable()
export class UserLock {
  constructor(private readonly redisService: RedisLock) {}

  async acquireUserLock(userId: number): Promise<Lock> {
    const ttl = 3000;
    const lockKey = `user:${userId}:lock`;
    let retries = 2;

    while (retries > 0) {
      const lock = await this.redisService.acquireLock(lockKey, ttl);
      if (lock) {
        return lock;
      }

      retries--;
      if (retries === 0) {
        throw new Error(
          '유저가 다른 작업을 진행중입니다. 잠시 후 다시 시도해주세요.',
        );
      }

      // 재시도 전 대기
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('락 획득 실패');
  }

  async releaseUserLock(lock: Lock): Promise<void> {
    if (!lock) return;
    await this.redisService.releaseLock(lock);
  }
}
