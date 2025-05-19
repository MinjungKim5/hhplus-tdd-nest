import { getPrismaClient, cleanupDatabase } from '../prisma.util';
import { cleanupRedis, setupRedis, teardownRedis } from '../redis.util';
import { ProductService } from 'src/product/application/product.service';
import { ProductRepository } from 'src/product/infrastructure/product.repository.impl';
import { RedisCache } from 'src/util/redis/redis.cache';
import Redis from 'ioredis';
import { RedisLock } from 'src/util/redis/redis.lock';
import { UserLock } from 'src/user/infrastructure/user.lock';
import { Product } from 'src/product/domain/product';
import * as fs from 'fs';
import * as path from 'path';
import { ProductRepositoryWithRedis } from 'src/product/infrastructure/product.repository.impl.redis';

const loadTestData = (fileName: string): any[] => {
  const filePath = path.resolve(__dirname, '../', fileName);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawData);
};

describe('ProductService Integration Tests', () => {
  let prisma: any;
  let productService: ProductService;
  let productRepository: ProductRepository | ProductRepositoryWithRedis;
  let redisClient: Redis;
  let cacheManager: any;
  let redisLock: RedisLock;
  let userLock: UserLock;
  let redisCache: RedisCache;
  const date = new Date();
  date.setDate(date.getDate() - 1); // 어제 날짜로 설정
  date.setHours(0, 0, 0, 0); // 시간, 분, 초, 밀리초를 0으로 설정

  beforeAll(async () => {
    prisma = getPrismaClient();
    try {
      const redis = await setupRedis();
      redisClient = redis.redisClient;
      cacheManager = redis.cacheManager;
    } catch (error) {
      console.error('Error setting up Redis:', error);
      throw error;
    }

    // Redis 서비스 인스턴스 생성
    redisLock = new RedisLock(redisClient);
    userLock = new UserLock(redisLock);
    redisCache = new RedisCache(cacheManager);

    // 레포지토리 인스턴스 생성
    productRepository = new ProductRepositoryWithRedis(prisma, redisClient);

    // 서비스 인스턴스 생성
    productService = new ProductService(productRepository, redisCache);
  });

  beforeEach(async () => {
    await cleanupDatabase();
    await cleanupRedis();

    // 테스트 데이터 로드
    const products = loadTestData('products-dataset.json');

    // 데이터베이스에 삽입
    await prisma.product.createMany({
      data: products,
    });

    // 추가적으로 ProductStat 데이터 생성
    for (let i = 0; i < Math.ceil(products.length / 10); i++) {
      const product = products[i];
      await productRepository.addProductSales(
        product.productId,
        Math.floor(Math.random() * 100) + 1,
        date,
      );
    }
    await productRepository.addProductSales(1, 200, date);
    await productRepository.addProductSales(2, 100, date);
  });

  afterAll(async () => {
    await cleanupRedis();
    await teardownRedis();
    await prisma.$disconnect();
  });

  describe('상품 목록 조회', () => {
    it('전체 상품 목록을 조회할 수 있다', async () => {
      const products = await productService.getProductList();

      expect(products).toHaveLength(1000);
      expect(products[0]).toMatchObject({
        productId: 1,
        name: 'RTX4090',
        category: '컴퓨터',
        brand: 'NVIDIA',
      });
    });

    it('베스트셀러 상품 목록을 조회하면 캐시에 저장된다', async () => {
      // 첫 번째 호출 - DB에서 조회
      const firstCall = await productService.getProductList('best-selling');
      expect(firstCall).toHaveLength(100);
      expect(firstCall[0].productId).toBe(1); // 판매량 100
      expect(firstCall[1].productId).toBe(2); // 판매량 50

      // 캐시 검증
      const cachedData = await redisCache.get<any[]>('best-sellers');
      expect(cachedData).toBeDefined();
      expect(cachedData).toHaveLength(100);
      expect(cachedData[0].productId).toBe(1);

      // 두 번째 호출 - 캐시에서 조회
      const secondCall = await productService.getProductList('best-selling');
      expect(secondCall).toEqual(firstCall);

      // 캐시 효과 검증을 위한 DB 데이터 변경
      await productRepository.addProductSales(2, 400, date); // 판매량 400추가가

      // 세 번째 호출 - 여전히 캐시의 데이터를 반환
      const thirdCall = await productService.getProductList('best-selling');
      expect(thirdCall).toEqual(firstCall); // DB 변경사항이 반영되지 않음
    });

    it('캐시가 만료되면 DB에서 새로운 데이터를 조회한다', async () => {
      // 첫 번째 호출로 캐시 설정
      const firstCall = await productService.getProductList('best-selling');

      // 캐시 강제 삭제
      await redisCache.del('best-sellers');

      // DB 데이터 변경
      await productRepository.addProductSales(2, 400, date); // 판매량 400추가가

      // 캐시 삭제 후 호출 - DB에서 새로운 데이터 조회
      const newCall = await productService.getProductList('best-selling');
      expect(newCall[0].productId).toBe(2); // 판매량 400 이상으로 1위
      expect(newCall[1].productId).toBe(1); // 판매량 200 이상으로 2위
    });
  });

  it('첫번쨰 조회보다 캐시된 조회 속도가 빠르다', async () => {
    // 첫 번째 호출 - DB에서 조회
    const startTime = Date.now();
    await productService.getProductList('best-selling');
    const firstCallDuration = Date.now() - startTime;

    // 두 번째 호출 - 캐시에서 조회
    const startTime2 = Date.now();
    await productService.getProductList('best-selling');
    const secondCallDuration = Date.now() - startTime2;

    console.log('First call duration:', firstCallDuration, 'ms');
    console.log('Second call duration:', secondCallDuration, 'ms');
    expect(secondCallDuration).toBeLessThan(firstCallDuration);
  });
});
