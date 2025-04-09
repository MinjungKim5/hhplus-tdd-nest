import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  GetProductParamDto,
  ProductOptionResDto,
  ProductResDto,
  SortDto,
} from './product.dto';
import { ProductService } from '../application/product.service';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Get()
  @ApiOperation({ summary: '상품목록을 조회. 인기상품 순 옵션 가능' })
  @ApiQuery({ name: 'sort', required: false })
  async getProductList(@Query() params?: SortDto): Promise<ProductResDto[]> {
    return this.productService.getProductList(params.sort);
  }

  @Get(':productId')
  @ApiOperation({ summary: '상품상세조회' })
  @ApiParam({ name: 'productId', type: 'number' })
  async getProductDetail(
    @Param() params: GetProductParamDto,
  ): Promise<ProductOptionResDto[]> {
    return this.productService.getProductDetail(params.productId);
  }
}
