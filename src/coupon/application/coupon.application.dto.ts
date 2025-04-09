export type CouponIssueResult = {
    couponId: number
    couponType: string
    benefit: number
    maxDiscount: number
    minPrice: number
    dueDate: Date
    used: boolean
    createdAt: Date
}
