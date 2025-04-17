import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../domain/order.repository';
import { MakeOrderDto, Order, OrderStatus } from '../domain/order';
import { PrismaService } from 'src/prisma/prisma.service';

export const OrderRepositoryToken = 'OrderRepositoryToken';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrderListByUser(userId: number): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      orderId: order.orderId,
      quantity: order.quantity,
      originalPrice: order.originalPrice,
      address: order.address,
      status: order.status as OrderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      userId: order.userId,
      optionId: order.optionId,
      productId: order.productId,
      name: order.name,
      category: order.category,
      brand: order.brand,
      optionName: order.optionName,
    }));
  }

  async getOrder(orderId: number): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: {
        orderId: orderId,
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    return {
      orderId: order.orderId,
      quantity: order.quantity,
      originalPrice: order.originalPrice,
      address: order.address,
      status: order.status as OrderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      userId: order.userId,
      optionId: order.optionId,
      productId: order.productId,
      name: order.name,
      category: order.category,
      brand: order.brand,
      optionName: order.optionName,
    };
  }

  async createOrder(order: MakeOrderDto): Promise<Order> {
    const result = await this.prisma.order.create({
      data: {
        userId: order.userId,
        productId: order.productId,
        optionId: order.optionId,
        quantity: order.quantity,
        originalPrice: order.originalPrice,
        address: order.address,
        name: order.name,
        category: order.category,
        brand: order.brand,
        optionName: order.optionName,
        status: OrderStatus.PENDING,
      },
    });

    return {
      orderId: result.orderId,
      quantity: result.quantity,
      originalPrice: result.originalPrice,
      address: result.address,
      status: result.status as OrderStatus,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      userId: result.userId,
      optionId: result.optionId,
      productId: result.productId,
      name: result.name,
      category: result.category,
      brand: result.brand,
      optionName: result.optionName,
    };
  }

  async updateOrder(
    orderId: number,
    orderChange: MakeOrderDto,
  ): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: {
        orderId: orderId,
      },
      data: {
        optionId: orderChange.optionId,
        category: orderChange.category,
        brand: orderChange.brand,
        name: orderChange.name,
        optionName: orderChange.optionName,
        quantity: orderChange.quantity,
        originalPrice: orderChange.originalPrice,
        address: orderChange.address,
      },
    });

    return {
      orderId: updatedOrder.orderId,
      quantity: updatedOrder.quantity,
      originalPrice: updatedOrder.originalPrice,
      address: updatedOrder.address,
      status: updatedOrder.status as OrderStatus,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      userId: updatedOrder.userId,
      optionId: updatedOrder.optionId,
      productId: updatedOrder.productId,
      name: updatedOrder.name,
      category: updatedOrder.category,
      brand: updatedOrder.brand,
      optionName: updatedOrder.optionName,
    };
  }

  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
  ): Promise<Order> {
    const updatedOrder = await this.prisma.order.update({
      where: {
        orderId: orderId,
      },
      data: {
        status: status,
      },
    });

    return {
      orderId: updatedOrder.orderId,
      quantity: updatedOrder.quantity,
      originalPrice: updatedOrder.originalPrice,
      address: updatedOrder.address,
      status: updatedOrder.status as OrderStatus,
      createdAt: updatedOrder.createdAt,
      updatedAt: updatedOrder.updatedAt,
      userId: updatedOrder.userId,
      optionId: updatedOrder.optionId,
      productId: updatedOrder.productId,
      name: updatedOrder.name,
      category: updatedOrder.category,
      brand: updatedOrder.brand,
      optionName: updatedOrder.optionName,
    };
  }
}
