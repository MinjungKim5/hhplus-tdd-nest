import { MakeOrderDto, Order, OrderStatus } from '../domain/order';
import { IOrderRepository } from '../domain/order.repository';
import { Inject } from '@nestjs/common';
import { OrderRepositoryToken } from '../infrastructure/order.repository.impl';
import { MakeOrderCommand } from './order.application.dto';
import { ProductRepositoryToken } from 'src/product/infrastructure/product.repository.impl';
import { IProductRepository } from 'src/product/domain/product.repository';
import { IRepositoryContext } from 'src/common/unit-of-work';
import { PurchaseCompletedEvent } from 'src/purchase/application/purchase.facade';
import { OnEventSafe } from 'src/util/event/event.emitter';

export class OrderService {
  constructor(
    @Inject(OrderRepositoryToken)
    private readonly orderRepository: IOrderRepository,
    @Inject(ProductRepositoryToken)
    private readonly productRepository: IProductRepository,
  ) {}
  async makeOrder(command: MakeOrderCommand): Promise<Order> {
    const productOption = await this.productRepository.getProductOption(
      command.optionId,
    );
    if (productOption.stock < command.quantity) {
      throw new Error('재고가 부족합니다.');
    }
    const newOrder = new MakeOrderDto(
      command.userId,
      productOption.productId,
      productOption.name,
      productOption.category,
      productOption.brand,
      productOption.price,
      productOption.optionId,
      productOption.optionName,
      command.quantity,
      command.address,
    );
    const order = await this.orderRepository.createOrder(newOrder);
    return order;
  }

  getOrderListByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.getOrderListByUser(userId);
  }

  createOrder(order: Order): Promise<Order> {
    return this.orderRepository.createOrder(order);
  }

  getOrder(orderId: number): Promise<Order> {
    return this.orderRepository.getOrder(orderId);
  }

  async updateOrder(
    orderId: number,
    command: MakeOrderCommand,
  ): Promise<Order> {
    const productOption = await this.productRepository.getProductOption(
      command.optionId,
    );
    if (productOption.stock < command.quantity) {
      throw new Error('재고가 부족합니다.');
    }
    const orderChange = new MakeOrderDto(
      command.userId,
      productOption.productId,
      productOption.name,
      productOption.category,
      productOption.brand,
      productOption.price,
      productOption.optionId,
      productOption.optionName,
      command.quantity,
      command.address,
    );
    return this.orderRepository.updateOrder(orderId, orderChange);
  }

  updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    return this.orderRepository.updateOrderStatus(orderId, status);
  }

  async getOrderWithTransaction(
    ctx: IRepositoryContext,
    orderId: number,
  ): Promise<Order> {
    return ctx.orderRepository.getOrder(orderId);
  }

  async updateOrderStatusWithTransaction(
    ctx: IRepositoryContext,
    orderId: number,
    status: OrderStatus,
  ): Promise<Order> {
    return ctx.orderRepository.updateOrderStatus(orderId, status);
  }

  @OnEventSafe('purchase.committed')
  async handlePurchaseEvent(event: PurchaseCompletedEvent): Promise<void> {
    const { orderId } = event;
    await this.updateOrderStatus(orderId, OrderStatus.COMPLETED);
  }
}
