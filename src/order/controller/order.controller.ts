import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { MakeOrderReqDto, OrderDto } from './order.dto';
import { GetUserParamDto } from '../../user/controller/user.dto';

@Controller('/order')
export class OrderController {
  constructor() {}

  @Get(':orderId')
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
}
