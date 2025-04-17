import { OrderService } from 'src/order/application/order.service';
import { PurchaseReqDto } from '../controller/purchase.dto';
import { PurchaseService } from '../domain/purchase.service';
import { PointService } from 'src/point/application/point.service';
import { ProductService } from 'src/product/application/product.service';
import { IPurchaseRepository } from '../domain/purchase.repository';
import { CreatePurchaseDto } from '../domain/purchase';
import { CouponService } from 'src/coupon/application/coupon.service';
import { OrderStatus } from 'src/order/domain/order';
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
      if (coupon.dueDate < new Date()) {
        throw new Error('쿠폰이 만료되었습니다.');
      }
      if (order.originalPrice < coupon.minPrice) {
        throw new Error('최소 사용 금액에 미달합니다.');
      }
    }
    let finalPrice = order.originalPrice;
    switch (coupon?.couponType) {
      case 'amount':
        finalPrice -= coupon.benefit;
        break;
      case 'percent':
        finalPrice -= Math.min(
          Math.floor((order.originalPrice * coupon.benefit) / 100),
          coupon.maxDiscount,
        );
      default:
        break;
    }
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
    if (coupon) await this.couponService.useCoupon(dto.couponIssueId);
    await this.productService.updateOptionStock(order.optionId, newStock);
    await this.productService.addProductSales(order.productId, order.quantity);
    await this.orderService.updateOrderStatus(
      order.orderId,
      OrderStatus.COMPLETED,
    );
    const createPurchaseDto: CreatePurchaseDto = {
      ...dto,
      finalPrice,
      status: '결제',
    };
    const purchase =
      await this.purchaseRepository.createPurchase(createPurchaseDto);
    return purchase;
  }
}
