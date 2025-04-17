import { IOrderRepository } from 'src/order/domain/order.repository';
import { getPrismaClient, cleanupDatabase } from '../prisma.util';
import { OrderService } from 'src/order/application/order.service';
import { OrderRepository } from 'src/order/infrastructure/order.repository.impl';
import { ProductRepository } from 'src/product/infrastructure/product.repository.impl';
import { IProductRepository } from 'src/product/domain/product.repository';
import { MakeOrderCommand } from 'src/order/application/order.application.dto';

describe('OrderService Integration Tests', () => {
  let prisma: any;
  let orderRepository: IOrderRepository;
  let orderService: OrderService;
  let productRepository: IProductRepository;

  beforeAll(async () => {
    prisma = getPrismaClient();
    orderRepository = new OrderRepository(prisma);
    productRepository = new ProductRepository(prisma);
    orderService = new OrderService(orderRepository, productRepository);
  });

  beforeEach(async () => {
    await cleanupDatabase();

    try {
      // 1. 유저 데이터 삽입
      await prisma.user.createMany({
        data: [
          {
            userId: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            point: 1000,
          },
          {
            userId: 2,
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            point: 500,
          },
        ],
      });

      // 2. 상품 데이터 삽입
      await prisma.product.createMany({
        data: [
          {
            productId: 1,
            name: 'RTX4090',
            category: '컴퓨터',
            brand: 'NVIDIA',
          },
          {
            productId: 2,
            name: 'RTX4080',
            category: '컴퓨터',
            brand: 'NVIDIA',
          },
        ],
      });

      // 3. 상품 옵션 데이터 삽입
      await prisma.productOption.createMany({
        data: [
          {
            optionId: 1,
            productId: 1,
            optionName: 'ROG',
            price: 2000000,
            stock: 10,
          },
          {
            optionId: 2,
            productId: 1,
            optionName: 'GIGABYTE',
            price: 1800000,
            stock: 0,
          },
          {
            optionId: 3,
            productId: 2,
            optionName: 'MSI',
            price: 1500000,
            stock: 5,
          },
        ],
      });
    } catch (error) {
      console.error('데이터 삽입 중 오류 발생:', error);
      throw error;
    }
  });

  it('상품옵션을 주문할 수 있다.', async () => {
    // given
    const orderCommand: MakeOrderCommand = {
      userId: 1,
      optionId: 1,
      quantity: 2,
      address: '서울시 강남구',
    };

    // when
    const result = await orderService.makeOrder(orderCommand);

    // then
    expect(result).toBeDefined();
    expect(result.userId).toBe(1);
    expect(result.optionId).toBe(1);
    expect(result.quantity).toBe(2);
    expect(result.address).toBe('서울시 강남구');
    expect(result.originalPrice).toBe(4000000); // 2000000 * 2
  });

  it('상품옵션의 재고가 없거나 재고량이 주문량보다 적으면 주문할 수 없다.', async () => {
    // Case 1: 재고가 없는 경우
    await expect(
      orderService.makeOrder({
        userId: 1,
        optionId: 2, // 재고 0개
        quantity: 1,
        address: '서울시 강남구',
      }),
    ).rejects.toThrow('재고가 부족합니다.');

    // Case 2: 재고가 주문량보다 적은 경우
    await expect(
      orderService.makeOrder({
        userId: 1,
        optionId: 3, // 재고 5개
        quantity: 6,
        address: '서울시 강남구',
      }),
    ).rejects.toThrow('재고가 부족합니다.');
  });

  it('기존 주문의 상품옵션을 바꿀 수 있다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 1,
      optionId: 1,
      quantity: 1,
      address: '서울시 강남구',
    });

    // when
    const updatedOrder = await orderService.updateOrder(order.orderId, {
      userId: 1,
      optionId: 3, // 다른 옵션으로 변경
      quantity: 1,
      address: '서울시 강남구',
    });

    // then
    expect(updatedOrder.optionId).toBe(3);
    expect(updatedOrder.originalPrice).toBe(1500000);
  });

  it('기존 주문의 주문량을 바꿀 수 있다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 1,
      optionId: 1,
      quantity: 1,
      address: '서울시 강남구',
    });

    // when
    const updatedOrder = await orderService.updateOrder(order.orderId, {
      userId: 1,
      optionId: 1,
      quantity: 2, // 수량 변경
      address: '서울시 강남구',
    });

    // then
    expect(updatedOrder.quantity).toBe(2);
    expect(updatedOrder.originalPrice).toBe(4000000);
  });

  it('기존 주문의 배송 주소를 바꿀 수 있다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 1,
      optionId: 1,
      quantity: 1,
      address: '서울시 강남구',
    });

    // when
    const updatedOrder = await orderService.updateOrder(order.orderId, {
      userId: 1,
      optionId: 1,
      quantity: 1,
      address: '서울시 서초구', // 주소 변경
    });

    // then
    expect(updatedOrder.address).toBe('서울시 서초구');
  });

  it('기존 주문 변경 시 변경하려는 옵션의 재고량이 주문량보다 적으면 주문을 변경할 수 없다.', async () => {
    // given
    const order = await orderService.makeOrder({
      userId: 1,
      optionId: 1,
      quantity: 1,
      address: '서울시 강남구',
    });

    // when & then
    await expect(
      orderService.updateOrder(order.orderId, {
        userId: 1,
        optionId: 3,
        quantity: 6, // 재고(5개)보다 많은 수량으로 변경 시도
        address: '서울시 강남구',
      }),
    ).rejects.toThrow('재고가 부족합니다.');
  });
});
