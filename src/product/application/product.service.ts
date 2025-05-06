import { Inject, Injectable } from '@nestjs/common';
import { Product, ProductOption } from '../domain/product';
import { IProductRepository } from '../domain/product.repository';
import { ProductRepositoryToken } from '../infrastructure/product.repository.impl';
import { IRepositoryContext } from 'src/common/unit-of-work';

@Injectable()
export class ProductService {
  constructor(
    @Inject(ProductRepositoryToken)
    private readonly productRepository: IProductRepository,
  ) {}

  getProductList(sort?: string): Promise<Product[]> {
    if (sort === 'best-selling') {
      return this.productRepository.getBestSellingProducts();
    }
    return this.productRepository.getProducts();
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
