import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';

let redisContainer: StartedTestContainer;
let redisClient: Redis;

export const setupRedis = async () => {
  if (redisContainer && redisClient) {
    return redisClient;
  }

  try {
    redisContainer = await new GenericContainer('redis:6')
      .withExposedPorts(6379)
      .withStartupTimeout(60000) // 60초 타임아웃 설정
      .start();

    const port = redisContainer.getMappedPort(6379);
    const host = redisContainer.getHost();

    console.log(`Test Redis is running on port: ${port}`);

    process.env.REDIS_HOST = host;
    process.env.REDIS_PORT = port.toString();
    console.log(`Redis URL: redis://${host}:${port}`);

    // Redis 클라이언트 생성 시 상세 설정 추가
    redisClient = new Redis({
      host,
      port,
      lazyConnect: true, // 필요할 때만 연결
      enableOfflineQueue: false, // 오프라인 큐 비활성화
      maxRetriesPerRequest: 3, // 요청당 최대 재시도 횟수
      retryStrategy(times) {
        // 재연결 전략
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      connectTimeout: 10000, // 연결 타임아웃 10초
    });

    // 연결 확인
    await redisClient.connect();
    const ping = await redisClient.ping();
    console.log(
      'Redis connection test:',
      ping === 'PONG' ? 'SUCCESS' : 'FAILED',
    );

    return redisClient;
  } catch (error) {
    console.error('Failed to setup Redis:', error);
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call setupRedis first.');
  }
  return redisClient;
};

export const cleanupRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.flushall();
    }
  } catch (error) {
    console.error('Failed to cleanup Redis:', error);
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
