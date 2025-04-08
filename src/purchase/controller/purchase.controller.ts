import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { GetPurchaseParamDto, PurchaseReqDto } from './purchase.dto';

@Controller('/purchase')
export class PurchaseController {
  constructor() {}
  @Post()
  @ApiOperation({ summary: '결제요청' })
  purchaseOrder(@Body() dto: PurchaseReqDto) {}

  @Get(':purchaseId')
  @ApiOperation({ summary: '결제내역 상세' })
  @ApiParam({ name: 'purchaseId', type: 'number' })
  getPurchaseDetail(@Param() params: GetPurchaseParamDto) {
    this.PurchaseService.getPurchaseDetail(params.purchaseId);
  }
}
