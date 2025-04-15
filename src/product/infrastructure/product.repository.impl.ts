import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../domain/product.repository';
import { Product, ProductOption } from '../domain/product';
import { PrismaService } from 'src/prisma/prisma.service';

export const ProductRepositoryToken = 'ProductRepositoryToken';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  updateOptionStock(optionId: number, stock: number): Promise<void> {
    return Promise.resolve();
  }

  addProductSales(productId: number, quantity: number): Promise<void> {
    return Promise.resolve();
  }
}
