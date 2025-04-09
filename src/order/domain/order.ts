export class Order {
  orderId: number;
  productId: number;
  name: string;
  category: string;
  brand: string;
  optionId: number;
  optionName: string;
  quantity: number;
  address: string;
  originalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class MakeOrderDto {
  productId: number;
  name: string;
  category: string;
  brand: string;
  optionId: number;
  optionName: string;
  quantity: number;
  address: string;
  originalPrice: number;

  constructor(
    productId: number,
    name: string,
    category: string,
    brand: string,
    price: number,
    optionId: number,
    optionName: string,
    quantity: number,
    address: string,
  ) {
    this.productId = productId;
    this.name = name;
    this.category = category;
    this.brand = brand;
    this.optionId = optionId;
    this.optionName = optionName;
    this.quantity = quantity;
    this.address = address;
    this.originalPrice = price * quantity;
  }
}

export enum OrderStatus {
  PENDING = '주문완료',
  COMPLETED = '결제완료',
  CANCELLED = '주문취소',
  REFUNDED = '환불완료',
}
