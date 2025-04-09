import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../domain/product.repository';
import { Product, ProductOption } from '../domain/product';

export const ProductRepositoryToken = 'ProductRepositoryToken';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor() {}

  getProducts(): Promise<Product[]> {
    return Promise.resolve([]);
  }

  getBestSellingProducts(): Promise<Product[]> {
    return Promise.resolve([]);
  }

  getProductDetail(productId: number): Promise<ProductOption[]> {
    return Promise.resolve([]);
  }

  getProductOption(optionId: number): Promise<ProductOption> {
    return Promise.resolve(new ProductOption());
  }

  getOptionStock(optionId: number): Promise<number> {
    return Promise.resolve(0);
  }
}
