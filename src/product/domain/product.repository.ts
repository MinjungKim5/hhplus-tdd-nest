import { Product, ProductOption } from './product';

export interface IProductRepository {
  getProducts(): Promise<Product[]>;
  getBestSellingProducts(): Promise<Product[]>;
  getProductDetail(productId: number): Promise<ProductOption[]>;
  getProductOption(optionId: number): Promise<ProductOption>;
  getOptionStock(optionId: number): Promise<number>;
}
