import { OrderService } from "src/order/application/order.service";
import { PurchaseReqDto } from "../controller/purchase.dto";
import { PurchaseService } from "../domain/purchase.service";
import { PointService } from "src/point/application/point.service";
import { ProductService } from "src/product/application/product.service";
import { IPurchaseRepository } from "../domain/purchase.repository";
import { CreatePurchaseDto } from "../domain/purchase";
export class PurchaseFacade {
  constructor(
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly orderService: OrderService,
    private readonly pointService: PointService,
    private readonly productService: ProductService,
  ) {}

  async purchaseOrder(dto: PurchaseReqDto) {
    const order = await this.orderService.getOrder(dto.orderId);
    const price = order.originalPrice;
    const point = await this.pointService.getPointByUser(dto.userId);
    const newPoint = point - price;
    if (newPoint < 0) {
      throw new Error('포인트가 부족합니다.');
    }
    const stock = await this.productService.getOptionStock(order.optionId);
    const newStock = stock - order.quantity;
    if (newStock < 0) {
      throw new Error('재고가 부족합니다.');
    }

    await this.pointService.usePoint(dto.userId, price);
    await this.productService.updateOptionStock(order.optionId, newStock);
    await this.productService.addProductSales(order.productId, order.quantity);
    const createPurchaseDto: CreatePurchaseDto = {
      ...dto,
      finalPrice: price,
      type: '결제',
    };
    const purchase = await this.purchaseRepository.createPurchase(createPurchaseDto);
    return purchase;
  }
}

