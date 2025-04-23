import { Inject, Injectable } from '@nestjs/common';
import { IRepositoryContext, IUnitOfWork } from 'src/common/unit-of-work';
import { PrismaService } from './prisma.service';
import { IOrderRepository } from 'src/order/domain/order.repository';
import { IProductRepository } from 'src/product/domain/product.repository';
import { IPointRepository } from 'src/point/domain/point.repository';
import { ICouponRepository } from 'src/coupon/domain/coupon.repository';
import { IPurchaseRepository } from 'src/purchase/domain/purchase.repository';
import { OrderRepositoryToken } from 'src/order/infrastructure/order.repository.impl';
import { ProductRepositoryToken } from 'src/product/infrastructure/product.repository.impl';
import { PointRepositoryToken } from 'src/point/infrastructure/point.repository.impl';
import { CouponRepositoryToken } from 'src/coupon/infrastructure/coupon.repository.impl';
import { PurchaseRepositoryToken } from 'src/purchase/infrastructure/purchase.repository.impl';

@Injectable()
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OrderRepositoryToken)
    private readonly orderRepositoryImpl: IOrderRepository,
    @Inject(ProductRepositoryToken)
    private readonly productRepositoryImpl: IProductRepository,
    @Inject(PointRepositoryToken)
    private readonly pointRepositoryImpl: IPointRepository,
    @Inject(CouponRepositoryToken)
    private readonly couponRepositoryImpl: ICouponRepository,
    @Inject(PurchaseRepositoryToken)
    private readonly purchaseRepositoryImpl: IPurchaseRepository,
  ) {}

  async runInTransaction<T>(
    fn: (ctx: IRepositoryContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // 트랜잭션 세션을 사용하는 새로운 레포지토리 인스턴스 생성
      const ctx: IRepositoryContext = {
        orderRepository: new (this.orderRepositoryImpl.constructor as any)(tx),
        productRepository: new (this.productRepositoryImpl.constructor as any)(
          tx,
        ),
        pointRepository: new (this.pointRepositoryImpl.constructor as any)(tx),
        couponRepository: new (this.couponRepositoryImpl.constructor as any)(
          tx,
        ),
        purchaseRepository: new (this.purchaseRepositoryImpl
          .constructor as any)(tx),
      };
      return fn(ctx);
    });
  }
}
