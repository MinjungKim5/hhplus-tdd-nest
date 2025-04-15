import { Injectable } from '@nestjs/common';
import { IPurchaseRepository } from '../domain/purchase.repository';
import { CreatePurchaseDto, Purchase } from '../domain/purchase';
import { PrismaService } from 'src/prisma/prisma.service';
export const PurchaseRepositoryToken = 'PurchaseRepositoryToken';

@Injectable()
export class PurchaseRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPurchase(purchase: CreatePurchaseDto): Promise<Purchase> {
    return Promise.resolve(new Purchase());
  }

  getPurchaseHistory(userId: number): Promise<Purchase[]> {
    return Promise.resolve([]);
  }

  getPurchaseDetail(purchaseId: number): Promise<Purchase> {
    return Promise.resolve(new Purchase());
  }
}
