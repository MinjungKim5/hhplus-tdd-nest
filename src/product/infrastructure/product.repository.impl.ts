import { Injectable } from '@nestjs/common';
import { IProductRepository } from '../domain/product.repository';
import { Product, ProductOption } from '../domain/product';
import { PrismaService } from 'src/prisma/prisma.service';

export const ProductRepositoryToken = 'ProductRepositoryToken';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(): Promise<Product[]> {
    const products = await this.prisma.product.findMany();
    return products;
  }

  async getBestSellingProducts(): Promise<Product[]> {
    const products = await this.prisma.$queryRaw<Product[]>`
      SELECT p.*, COALESCE(SUM(ps.sales), 0) as total_sales
      FROM Product p
      LEFT JOIN ProductStat ps ON p.productId = ps.productId
      WHERE ps.date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
      GROUP BY p.productId
      ORDER BY total_sales DESC
    `;
    return products;
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

  async getOptionStock(optionId: number): Promise<number> {
    const value = await this.prisma.productOption.findUnique({
      where: { optionId },
      select: { stock: true },
    });
    return value.stock;
  }

  async updateOptionStock(optionId: number, stock: number): Promise<void> {
    await this.prisma.productOption.update({
      where: { optionId },
      data: { stock },
    });
    return;
  }

  async addProductSales(productId: number, quantity: number): Promise<void> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    await this.prisma.productStat.upsert({
      where: { productId_date: { productId, date: todayStart } },
      update: {
        sales: {
          increment: quantity,
        },
      },
      create: {
        productId,
        date: todayStart,
        sales: quantity,
      },
    });
    return;
  }
}
