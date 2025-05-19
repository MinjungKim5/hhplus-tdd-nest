import { Injectable } from '@nestjs/common';
import { IPurchaseRepository } from '../domain/purchase.repository';
import { CreatePurchaseDto, Purchase } from '../domain/purchase';
import { PrismaService } from 'src/util/prisma/prisma.service';

export const PurchaseRepositoryToken = 'PurchaseRepositoryToken';

@Injectable()
export class PurchaseRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPurchase(purchase: CreatePurchaseDto): Promise<Purchase> {
    const result = await this.prisma.purchase.create({
      data: {
        userId: purchase.userId,
        orderId: purchase.orderId,
        couponId: purchase.couponId,
        finalPrice: purchase.finalPrice,
        status: purchase.status,
      },
    });

    return new Purchase(
      result.purchaseId,
      result.userId,
      result.orderId,
      result.couponId,
      result.finalPrice,
      result.status,
      result.createdAt,
      result.updatedAt,
    );
  }

  async getPurchaseHistory(userId: number): Promise<Purchase[]> {
    const results = await this.prisma.purchase.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return results.map(
      (result) =>
        new Purchase(
          result.purchaseId,
          result.userId,
          result.orderId,
          result.couponId,
          result.finalPrice,
          result.status,
          result.createdAt,
          result.updatedAt,
        ),
    );
  }

  async getPurchaseDetail(purchaseId: number): Promise<Purchase> {
    const result = await this.prisma.purchase.findUnique({
      where: {
        purchaseId: purchaseId,
      },
    });

    if (!result) {
      throw new Error(`Purchase with ID ${purchaseId} not found`);
    }

    return new Purchase(
      result.purchaseId,
      result.userId,
      result.orderId,
      result.couponId,
      result.finalPrice,
      result.status,
      result.createdAt,
      result.updatedAt,
    );
  }
}
