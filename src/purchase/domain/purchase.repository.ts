import { CreatePurchaseDto, Purchase } from './purchase';

export interface IPurchaseRepository {
  createPurchase(purchase: CreatePurchaseDto): Promise<Purchase>;
  getPurchaseHistory(userId: number): Promise<Purchase[]>;
}
