import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../domain/product.repository';
import { Product, ProductOption } from '../domain/product';
import { PrismaService } from 'src/util/prisma/prisma.service';
import Redis from 'ioredis';

export const ProductRepositoryWithRedisToken =
  'ProductRepositoryWithRedisToken';

@Injectable()
export class ProductRepositoryWithRedis implements IProductRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
  ) {}

  async getProducts(): Promise<Product[]> {
    const products = await this.prisma.product.findMany();
    return products;
  }

  // 레디스 db 에서 소팅된 베스트셀러 상품을 가져오도록 변경
  async getBestSellingProducts(): Promise<Product[]> {
    const today = new Date();
    const key = `top-sales:${today.toISOString().split('T')[0]}`;
    await this.setSalesScoreFor3Days(today);
    const rankedResult = await this.redis.zrevrange(key, 0, 999);
    const productIds = rankedResult.map((item) => {
      const [productId] = item.split(':');
      return Number(productId);
    });
    const products = await this.prisma.product.findMany({
      where: { productId: { in: productIds } },
    });
    const rankedProducts = productIds.map((productId) => {
      const product = products.find((p) => p.productId === productId);
      return {
        productId,
        name: product?.name,
        category: product?.category,
        brand: product?.brand,
      };
    });
    return rankedProducts;
  }

  async getProductDetail(productId: number): Promise<ProductOption[]> {
    const [product, options] = await Promise.all([
      this.prisma.product.findUnique({ where: { productId } }),
      this.prisma.productOption.findMany({ where: { productId } }),
    ]);
    return options.map((option) => {
      return { ...option, ...product };
    });
  }

  async getProductOption(optionId: number): Promise<ProductOption> {
    const option = await this.prisma.productOption.findUnique({
      where: { optionId },
    });
    const product = await this.prisma.product.findUnique({
      where: { productId: option.productId },
    });
    return { ...option, ...product };
  }

  async getProductOptionForUpdate(optionId: number): Promise<ProductOption> {
    const [option] = await this.prisma.$queryRaw<ProductOption[]>`
      SELECT * 
      FROM ProductOption 
      WHERE optionId = ${optionId}
      FOR UPDATE
    `;

    if (!option) {
      throw new Error('해당 옵션을 찾을 수 없습니다.');
    }

    return option;
  }

  async getOptionStock(optionId: number): Promise<number> {
    const value = await this.prisma.productOption.findUnique({
      where: { optionId },
      select: { stock: true },
    });
    return value.stock;
  }

  async decrementOptionStock(
    optionId: number,
    quantity: number,
  ): Promise<void> {
    const result = await this.prisma.productOption.updateMany({
      where: {
        optionId,
      },
      data: {
        stock: { decrement: quantity },
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new Error('동시성 문제 발생!');
    }
    return;
  }

  async addProductSales(
    productId: number,
    quantity: number,
    todayStart: Date,
  ): Promise<void> {
    const key = `sales:${todayStart.toISOString().split('T')[0]}`;
    try {
      await this.redis.hincrby(key, productId.toString(), quantity);
      await this.redis.expire(key, 4 * 24 * 60 * 60); // 4일 후 만료;
    } catch (error) {
      console.error('Redis error:', error);
    }
    return;
  }

  private async setSalesScoreFor3Days(today: Date): Promise<void> {
    const dMinus1 = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const dMinus2 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const dMinus3 = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    const salesRecords = [];
    salesRecords.push(
      await this.redis.hgetall(`sales:${dMinus1.toISOString().split('T')[0]}`),
    );
    salesRecords.push(
      await this.redis.hgetall(`sales:${dMinus2.toISOString().split('T')[0]}`),
    );
    salesRecords.push(
      await this.redis.hgetall(`sales:${dMinus3.toISOString().split('T')[0]}`),
    );
    // ZADD에 사용할 데이터 준비
    const zObject: (string | number)[] = [];
    for (const salesData of salesRecords) {
      if (!salesData) {
        continue;
      }
      for (const [productId, sales] of Object.entries(salesData)) {
        zObject.push(Number(sales), productId);
      }
    }

    // ZADD 명령으로 한 번에 추가
    const key = `top-sales:${today.toISOString().split('T')[0]}`;
    if (zObject.length > 0) {
      await this.redis.zadd(key, ...zObject);
      await this.redis.expire(key, 2 * 24 * 60 * 60); // 2일 후 만료
    }
  }
}
