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
    const rawProducts = await this.prisma.$queryRaw<Product[]>`
      SELECT p.productId, p.name, p.category, p.brand
      FROM Product p
      LEFT JOIN ProductStat ps ON p.productId = ps.productId
      WHERE ps.date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
      GROUP BY p.productId
      ORDER BY COALESCE(SUM(ps.sales), 0) DESC
    `;

    // 반환값을 Product 도메인에 맞게 매핑
    return rawProducts.map((product) => ({
      productId: product.productId,
      name: product.name,
      category: product.category,
      brand: product.brand,
    }));
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
    try {
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
    } catch (error) {
      throw new Error('상품 판매 통계 업데이트에 실패했습니다.');
    }
    return;
  }
}
