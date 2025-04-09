export class Purchase {
    id: number
    userId: number
    orderId: number
    couponIssueId?: number
    finalPrice: number
    type: string
    createdAt: Date
    updatedAt: Date
}

export class CreatePurchaseDto {
    userId: number
    orderId: number
    couponIssueId?: number
    finalPrice: number
    type: string
}

