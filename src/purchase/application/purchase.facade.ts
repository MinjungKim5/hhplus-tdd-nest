import { EventBus } from '@nestjs/cqrs';
import { OrderService } from 'src/order/application/order.service';
import { PurchaseReqDto } from '../controller/purchase.dto';
import { PurchaseService } from '../domain/purchase.service';
import { PointService } from 'src/point/application/point.service';
// import { ProductService } from 'src/product/application/product.service';
import { IPurchaseRepository } from '../domain/purchase.repository';
import { CouponService } from 'src/coupon/application/coupon.service';
import { OrderStatus } from 'src/order/domain/order';
import { PrismaUnitOfWork } from 'src/util/prisma/prisma.transaction';
import { Inject, Injectable } from '@nestjs/common';
import { UserLock } from 'src/user/infrastructure/user.lock';
import { PurchaseRepositoryToken } from '../infrastructure/purchase.repository.impl';
import { PProductService } from 'src/product/application/product.service2';
import { CompletePurchaseEvent } from './purchase.event';

@Injectable()
export class PurchaseFacade {
  constructor(
    private readonly unitOfWork: PrismaUnitOfWork,
    private readonly orderService: OrderService,
    private readonly pointService: PointService,
    private readonly productService: PProductService,
    private readonly couponService: CouponService,
    private readonly userLock: UserLock,
    private readonly eventBus: EventBus,
    @Inject(PurchaseRepositoryToken)
    private readonly purchaseRepository: IPurchaseRepository,
  ) {}

  async purchaseOrder(dto: PurchaseReqDto) {
    const lock = await this.userLock.acquireUserLock(dto.userId);
    let retries = 3;
    while (retries > 0) {
      try {
        const purchaseCompleted = await this.unitOfWork.runInTransaction(
          async (ctx) => {
            // 주문 조회
            const order = await this.orderService.getOrderWithTransaction(
              ctx,
              dto.orderId,
            );

            // 쿠폰 조회 및 할인 계산
            let finalPrice = order.originalPrice;
            if (dto.couponId) {
              finalPrice = await this.couponService.applyCouponWithTransaction(
                ctx,
                finalPrice,
                dto.userId,
                dto.couponId,
              );
            }

            // 쿠폰 사용
            if (dto.couponId) {
              await this.couponService.useCouponWithTransaction(
                ctx,
                dto.userId,
                dto.couponId,
              );
            }

            // 재고 업데이트
            // await this.productService.decreaseOptionStockWithTransaction(
            //   ctx,
            //   order.optionId,
            //   order.quantity,
            // );

            // 포인트 차감
            await this.pointService.usePoint(dto.userId, finalPrice);

            return new CompletePurchaseEvent(
              dto.userId,
              order.productId,
              order.quantity,
              order.orderId,
              dto.couponId,
              finalPrice,
            );
          },
        );

        await this.eventBus.publish(purchaseCompleted);
        return await this.purchaseRepository.createPurchase({
          ...dto,
          finalPrice: purchaseCompleted.finalPrice,
          status: '결제',
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
