import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  GetProductParamDto,
  ProductDto,
  ProductOptionDto,
  SortDto,
} from './product.dto';

@Controller('product')
export class ProductController {
  constructor() {}
  @Get()
  @ApiOperation({ summary: '상품목록을 조회. 인기상품 순 옵션 가능' })
  @ApiQuery({ name: 'sort', required: false })
  async getProductList(@Query() params?: SortDto): Promise<ProductDto[]> {
    if (params.sort === 'best-selling') return [new ProductDto()];
    return [new ProductDto()];
  }

  @Get(':productId')
  @ApiOperation({ summary: '상품상세조회' })
  @ApiParam({ name: 'productId', type: 'number' })
  async getProductDetail(
    @Param() params: GetProductParamDto,
  ): Promise<ProductOptionDto[]> {
    return [new ProductOptionDto()];
  }
}
