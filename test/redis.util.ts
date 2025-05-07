import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';
import { Cache } from '@nestjs/cache-manager';

let redisContainer: StartedTestContainer;
let redisClient: Redis;
let cacheManager: Cache;

export const setupRedis = async () => {
  if (redisContainer && redisClient && cacheManager) {
    return { redisClient, cacheManager };
  }

  try {
    // 1. Docker 컨테이너 시작
    redisContainer = await new GenericContainer('redis:6')
      .withExposedPorts(6379)
      .withStartupTimeout(60000)
      .start();

    const port = redisContainer.getMappedPort(6379);
    const host = redisContainer.getHost();

    console.log(`Starting Redis container on ${host}:${port}`);

    // 2. Redis 클라이언트 설정
    redisClient = new Redis({
      host,
      port,
      lazyConnect: true,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      connectTimeout: 10000,
    });

    // 3. Redis 연결 확인
    await redisClient.connect();
    const ping = await redisClient.ping();
    if (ping !== 'PONG') {
      throw new Error('Redis connection failed');
    }
    console.log('Redis connection test: SUCCESS');

    cacheManager = {
      get: async (key: string) => redisClient.get(key),
      set: async (key: string, value: any, ttl?: number) =>
        redisClient.set(key, JSON.stringify(value), 'EX', ttl || 3600),
      del: async (key: string) => redisClient.del(key),
      mget: async (...keys: string[]) => redisClient.mget(...keys),
      mset: async (...args: [string, any][]) => {
        const flatArgs = args.flatMap(([key, value]) => [
          key,
          JSON.stringify(value),
        ]);
        await redisClient.mset(...flatArgs);
      },
      ttl: async (key: string) => redisClient.ttl(key),
      reset: async () => redisClient.flushdb(),
      keys: async (pattern: string) => redisClient.keys(pattern),
    } as unknown as Cache;

    return { redisClient, cacheManager };
  } catch (error) {
    console.error('Failed to setup Redis:', error);
    await teardownRedis();
    throw error;
  }
};

export const teardownRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
    if (redisContainer) {
      await redisContainer.stop();
      redisContainer = null;
    }
  } catch (error) {
    console.error('Failed to teardown Redis:', error);
  }
};

// ioredis를 기반으로 Cache 구현
export const createRedisCache = (): Cache => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call setupRedis first.');
  }

  return {
    get: async <T>(key: string): Promise<T | undefined> => {
      const value = await redisClient.get(key);
      return value ? (JSON.parse(value) as T) : undefined;
    },
    set: async (key: string, value: any, options?: { ttl?: number }): Promise<void> => {
      const ttl = options?.ttl || 3600; // 기본 TTL: 1시간
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    },
    del: async (key: string): Promise<void> => {
      await redisClient.del(key);
    },
    wrap: async <T>(
      key: string,
      fn: () => Promise<T>,
      options?: { ttl?: number },
    ): Promise<T> => {
      const cachedValue = await redisClient.get(key);
      if (cachedValue) {
        return JSON.parse(cachedValue) as T;
      }
      const newValue = await fn();
      const ttl = options?.ttl || 3600;
      await redisClient.set(key, JSON.stringify(newValue), 'EX', ttl);
      return newValue;
    },
    mget: async (...keys: string[]): Promise<(string | null)[]> => {
      return await redisClient.mget(...keys);
    },
    mset: async (...args: [string, any][]): Promise<void> => {
      const flatArgs = args.flatMap(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await redisClient.mset(...flatArgs);
    },
    ttl: async (key: string): Promise<number> => {
      return await redisClient.ttl(key);
    },
    reset: async (): Promise<void> => {
      await redisClient.flushdb();
    },
    keys: async (pattern: string): Promise<string[]> => {
      return await redisClient.keys(pattern);
    },
  } as unknown as Cache;
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call setupRedis first.');
  }
  return redisClient;
};

export const cleanupRedis = async () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call setupRedis first.');
  }
  await redisClient.flushdb();
};
