import { OrderStatus } from '../domain/order';

export class MakeOrderCommand {
  optionId: number;
  quantity: number;
  address: string;
}

export class UpdateOrderCommand {
  orderId: number;
  quantity: number;
  address: string;
}

export class UpdateOrderStatusCommand {
  orderId: number;
  status: OrderStatus;
}
