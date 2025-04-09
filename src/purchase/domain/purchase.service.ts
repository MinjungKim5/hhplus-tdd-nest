import { IPurchaseRepository } from "./purchase.repository";

export class PurchaseService {
    constructor(
        private readonly purchaseRepository: IPurchaseRepository,
    ){}

    getPurchaseHistory(userId: number) {
        return this.purchaseRepository.getPurchaseHistory(userId);
    }
}
