import { MakeOrderDto, Order, OrderStatus } from './order';
import { MakeOrderCommand } from '../application/order.application.dto';
export interface IOrderRepository {
  getOrderListByUser(userId: number): Promise<Order[]>;
  getOrder(orderId: number): Promise<Order>;
  createOrder(order: MakeOrderDto): Promise<Order>;
  updateOrder(orderId: number, orderChange: MakeOrderDto): Promise<Order>;
  updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order>;
}
