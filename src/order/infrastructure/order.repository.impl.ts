import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../domain/order.repository';
import { MakeOrderDto, Order, OrderStatus } from '../domain/order';

export const OrderRepositoryToken = 'OrderRepositoryToken';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor() {}
  getOrderListByUser(userId: number): Promise<Order[]> {
    return Promise.resolve([]);
  }
  getOrder(orderId: number): Promise<Order> {
    return Promise.resolve(null);
  }
  createOrder(order: MakeOrderDto): Promise<Order> {
    return null;
  }
  updateOrder(orderId: number, orderChange: MakeOrderDto): Promise<Order> {
    return null;
  }
  updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    return null;
  }
}
