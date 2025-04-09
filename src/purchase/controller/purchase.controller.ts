import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GetPurchaseParamDto, PurchaseReqDto } from './purchase.dto';
import { PurchaseFacade } from '../application/purchase.facade';
import { PurchaseService } from '../domain/purchase.service';
import { GetUserParamDto } from 'src/user/controller/user.dto';

@Controller('/purchase')
export class PurchaseController {
  constructor(
    private readonly purchaseFacade: PurchaseFacade,
    private readonly purchaseService: PurchaseService,
  ) {}
  @Post()
  @ApiOperation({ summary: '결제요청' })
  purchaseOrder(@Body() dto: PurchaseReqDto) {
    return this.purchaseFacade.purchaseOrder(dto);
  }

  @Get()
  @ApiOperation({ summary: '구매내역 조회' })
  getPurchaseHistory(@Query('userId') userId: number) {
    return this.purchaseService.getPurchaseHistory(userId);
  }
}
