import { Injectable } from "@nestjs/common";
import { RedisService } from "src/redis/redis.service";
import {Lock} from "redlock"
@Injectable()
export class UserLock {
  constructor(private readonly redisService: RedisService) {}

  async acquireUserLock(userId: number): Promise<Lock> {
    const ttl = 1000;
    const maxRetries = 3;
    const lockKey = `user:${userId}:lock`;
    let retries = 0;

    while (retries < maxRetries) {
      const lock = await this.redisService.acquireLock(lockKey, ttl);
      if (lock) {
        return lock;
      }

      retries++;
      if (retries >= maxRetries) {
        throw new Error('유저가 다른 작업을 진행중입니다. 잠시 후 다시 시도해주세요.');
      }

      // 재시도 전 대기
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('락 획득 실패');
  }

  async releaseUserLock(lock: Lock): Promise<void> {
    await this.redisService.releaseLock(lock);
  }
}