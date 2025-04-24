import { ICouponRepository } from 'src/coupon/domain/coupon.repository';
import { IOrderRepository } from 'src/order/domain/order.repository';
import { IPointRepository } from 'src/point/domain/point.repository';
import { IProductRepository } from 'src/product/domain/product.repository';
import { IPurchaseRepository } from 'src/purchase/domain/purchase.repository';

export interface IUnitOfWork {
  runInTransaction<T>(
    fn: (repos: IRepositoryContext) => Promise<T>,
  ): Promise<T>;
}

export interface IRepositoryContext {
  orderRepository: IOrderRepository;
  productRepository: IProductRepository;
  pointRepository: IPointRepository;
  couponRepository: ICouponRepository;
  purchaseRepository: IPurchaseRepository;
}
