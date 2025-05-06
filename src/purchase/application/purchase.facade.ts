import { OrderService } from 'src/order/application/order.service';
import { PurchaseReqDto } from '../controller/purchase.dto';
import { PurchaseService } from '../domain/purchase.service';
import { PointService } from 'src/point/application/point.service';
import { ProductService } from 'src/product/application/product.service';
import { IPurchaseRepository } from '../domain/purchase.repository';
import { CouponService } from 'src/coupon/application/coupon.service';
import { OrderStatus } from 'src/order/domain/order';
import { PrismaUnitOfWork } from 'src/prisma/prisma.transaction';
import { Inject } from '@nestjs/common';
import { UserLock } from 'src/user/infrastructure/user.lock';
export class PurchaseFacade {
  constructor(
    private readonly unitOfWork: PrismaUnitOfWork,
    private readonly orderService: OrderService,
    private readonly pointService: PointService,
    private readonly productService: ProductService,
    private readonly couponService: CouponService,
    private readonly userLock: UserLock,
  ) {}

  async purchaseOrder(dto: PurchaseReqDto) {
    //포인트 차감을 위한 락 획득
    const lock = await this.userLock.acquireUserLock(dto.userId);
    let retries = 3;
    while (retries > 0) {
      try {
        return await this.unitOfWork.runInTransaction(async (ctx) => {
          // 주문 조회
          const order = await this.orderService.getOrderWithTransaction(
            ctx,
            dto.orderId,
          );

          // 쿠폰 조회 및 할인 계산
          let finalPrice = order.originalPrice;
          if (dto.couponIssueId) {
            finalPrice = await this.couponService.applyCouponWithTransaction(
              ctx,
              finalPrice,
              dto.couponIssueId,
            );
          }

          // 쿠폰 사용
          if (dto.couponIssueId) {
            await this.couponService.useCouponWithTransaction(
              ctx,
              dto.couponIssueId,
            );
          }

          // 재고 업데이트
          await this.productService.decreaseOptionStockWithTransaction(
            ctx,
            order.optionId,
            order.quantity,
          );

          // 판매량 업데이트
          await this.productService.addProductSalesWithTransaction(
            ctx,
            order.productId,
            order.quantity,
          );

          // 주문 상태 업데이트
          await this.orderService.updateOrderStatusWithTransaction(
            ctx,
            order.orderId,
            OrderStatus.COMPLETED,
          );

          const purchase = await ctx.purchaseRepository.createPurchase({
            ...dto,
            finalPrice,
            status: '결제',
          });

          // 포인트 차감
          await this.pointService.usePoint(dto.userId, finalPrice);

          return purchase;
        });
      } catch (error) {
        // 재시도하면 안 되는 에러들
        if (
          error.message === '재고가 부족합니다.' ||
          error.message === '잔액이 부족합니다.' ||
          error.message === '이미 사용된 쿠폰입니다.'
        ) {
          throw error;
        }

        retries--;
        if (retries === 0) {
          throw new Error(
            '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
          );
        }

        // 재시도 전 잠시 대기
        await new Promise((resolve) => setTimeout(resolve, 10));
      } finally {
        // 락 해제
        if (lock) {
          await this.userLock.releaseUserLock(lock);
        }
      }
    }
  }
}
