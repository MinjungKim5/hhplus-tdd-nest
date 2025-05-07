import { Inject, Injectable } from '@nestjs/common';
import { Product, ProductOption } from '../domain/product';
import { IProductRepository } from '../domain/product.repository';
import { ProductRepositoryToken } from '../infrastructure/product.repository.impl';
import { IRepositoryContext } from 'src/common/unit-of-work';
import { RedisCache } from 'src/redis/redis.cache';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ProductService {
  private readonly BEST_SELLERS_CACHE_KEY = 'best-sellers';
  private readonly CACHE_TTL = 24 * 60 * 60 - 1; // 1일 - 1초 (초 단위)

  constructor(
    @Inject(ProductRepositoryToken)
    private readonly productRepository: IProductRepository,
    private readonly redisCache: RedisCache,
  ) {}

  async getProductList(sort?: string): Promise<Product[]> {
    if (sort === 'best-selling') {
      return this.getBestSellingProductsWithCache();
    }
    return this.productRepository.getProducts();
  }

  @Cron('0 0 * * *')
  private async getBestSellingProductsWithCache(): Promise<Product[]> {
    // 캐시에서 데이터 조회
    const cachedData = await this.redisCache.get<Product[]>(
      this.BEST_SELLERS_CACHE_KEY,
    );
    if (cachedData) {
      return cachedData;
    }

    // 캐시 미스: DB에서 조회 후 캐시 저장
    const products = await this.productRepository.getBestSellingProducts();
    await this.redisCache.set(
      this.BEST_SELLERS_CACHE_KEY,
      products,
      this.CACHE_TTL,
    );

    return products;
  }

  getProductDetail(productId: number): Promise<ProductOption[]> {
    return this.productRepository.getProductDetail(productId);
  }

  getProductOption(optionId: number): Promise<ProductOption> {
    return this.productRepository.getProductOption(optionId);
  }

  getOptionStock(optionId: number): Promise<number> {
    return this.productRepository.getOptionStock(optionId);
  }

  // async updateOptionStock(optionId: number, stock: number): Promise<void> {
  //   return await this.productRepository.updateOptionStock(
  //     optionId,
  //     stock,
  //   );
  // }

  async addProductSales(productId: number, quantity: number): Promise<void> {
    return await this.productRepository.addProductSales(productId, quantity);
  }

  async decreaseOptionStockWithTransaction(
    ctx: IRepositoryContext,
    optionId: number,
    quantity: number,
  ): Promise<void> {
    // 비관적 락을 사용하여 옵션 데이터를 가져옴
    const productOption =
      await ctx.productRepository.getProductOptionForUpdate(optionId);

    const newStock = productOption.stock - quantity;
    if (newStock < 0) {
      throw new Error('재고가 부족합니다.');
    }
    await ctx.productRepository.decrementOptionStock(optionId, quantity);
    return;
  }

  async addProductSalesWithTransaction(
    ctx: IRepositoryContext,
    productId: number,
    quantity: number,
  ): Promise<void> {
    await ctx.productRepository.addProductSales(productId, quantity);
  }
}
