import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { MakeOrderReqDto, OrderDto, PurchaseReqDto } from './order.dto';
import { GetUserParamDto } from 'src/user/user.dto';

@Controller('/order')
export class OrderController {
  constructor() {}

  @Get(':userId')
  @ApiOperation({ summary: '유저의 주문내역 조회' })
  @ApiParam({ name: 'userId', type: 'number' })
  async getOrdersByUser(@Param() params: GetUserParamDto): Promise<OrderDto[]> {
    return [new OrderDto()];
  }

  @Post()
  @ApiOperation({ summary: '주문' })
  async makeOrder(@Body() dto: MakeOrderReqDto): Promise<OrderDto> {
    return new OrderDto();
  }

  @Post('purchase')
  @ApiOperation({ summary: '결제' })
  async purchaseOrder(@Body() dto: PurchaseReqDto): Promise<OrderDto> {
    const order = new OrderDto();
    return {
      ...order,
      couponIssueId: 1,
      finalPrice: 900000,
      status: '결제완료',
    };
  }
}
