import { Product, ProductOption } from './product';

export interface IProductRepository {
  getProducts(): Promise<Product[]>;
  getBestSellingProducts(): Promise<Product[]>;
  getProductDetail(productId: number): Promise<ProductOption[]>;
  getProductOption(optionId: number): Promise<ProductOption>;
  getProductOptionForUpdate(optionId: number): Promise<ProductOption>;
  getOptionStock(optionId: number): Promise<number>;
  decrementOptionStock(
    optionId: number,
    quantity: number,
  ): Promise<void>;
  addProductSales(productId: number, quantity: number): Promise<void>;
}
