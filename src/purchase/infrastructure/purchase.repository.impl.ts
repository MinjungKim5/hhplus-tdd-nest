import { Injectable } from '@nestjs/common';
import { IPurchaseRepository } from '../domain/purchase.repository';
import { CreatePurchaseDto, Purchase } from '../domain/purchase';
export const PurchaseRepositoryToken = 'PurchaseRepositoryToken';

@Injectable()
export class PurchaseRepository implements IPurchaseRepository {
  constructor() {}

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
