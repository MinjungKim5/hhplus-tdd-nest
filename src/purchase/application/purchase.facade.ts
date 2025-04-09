import { OrderService } from "src/order/application/order.service";
import { PurchaseReqDto } from "../controller/purchase.dto";
import { PurchaseService } from "../domain/purchase.service";
import { PointService } from "src/point/application/point.service";
import { ProductService } from "src/product/application/product.service";
import { IPurchaseRepository } from "../domain/purchase.repository";
import { CreatePurchaseDto } from "../domain/purchase";
import { CouponService } from "src/coupon/application/coupon.service";
export class PurchaseFacade {
  constructor(
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly orderService: OrderService,
    private readonly pointService: PointService,
    private readonly productService: ProductService,
    private readonly couponService: CouponService,
  ) {}

  async purchaseOrder(dto: PurchaseReqDto) {
    const order = await this.orderService.getOrder(dto.orderId);
    const coupon = await this.couponService.getCouponIssue(dto.couponIssueId);
    if (coupon) {
      if (coupon.used === true) {
        throw new Error('이미 사용된 쿠폰입니다.');
      }
    }
    const finalPrice = coupon ? order.originalPrice - coupon.benefit : order.originalPrice;
    const point = await this.pointService.getPointByUser(dto.userId);
    const newPoint = point - finalPrice;
    if (newPoint < 0) {
      throw new Error('포인트가 부족합니다.');
    }
    const stock = await this.productService.getOptionStock(order.optionId);
    const newStock = stock - order.quantity;
    if (newStock < 0) {
      throw new Error('재고가 부족합니다.');
    }

    await this.pointService.usePoint(dto.userId, finalPrice);
    await this.couponService.useCoupon(dto.couponIssueId);
    await this.productService.updateOptionStock(order.optionId, newStock);
    await this.productService.addProductSales(order.productId, order.quantity);
    const createPurchaseDto: CreatePurchaseDto = {
      ...dto,
      finalPrice,
      type: '결제',
    };
    const purchase = await this.purchaseRepository.createPurchase(createPurchaseDto);
    return purchase;
  }
}

