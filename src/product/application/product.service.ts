import { Inject, Injectable } from '@nestjs/common';
import { Product, ProductOption } from '../domain/product';
import { IProductRepository } from '../domain/product.repository';
import { ProductRepositoryToken } from '../infrastructure/product.repository.impl';

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

  async updateOptionStock(optionId: number, stock: number): Promise<void> {
    return await this.productRepository.updateOptionStock(optionId, stock);
  }

  async addProductSales(productId: number, quantity: number): Promise<void> {
    return await this.productRepository.addProductSales(productId, quantity);
  }
}
