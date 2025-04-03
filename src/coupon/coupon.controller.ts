import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ClaimCouponResDto, CouponDto, CouponIssueDto } from './coupon.dto';
import { GetUserParamDto } from 'src/user/user.dto';

@Controller('/coupon')
export class CouponController {
  constructor() {}

  @Get('')
  @ApiOperation({ summary: '발급가능한 쿠폰 목록 조회' })
  async getCoupons(): Promise<CouponDto[]> {
    return [new CouponDto()];
  }

  @Get(':userId')
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiOperation({ summary: '발급받은 쿠폰 목록 조회' })
  async getCouponIssuesByUser(
    @Param() params: GetUserParamDto,
  ): Promise<CouponIssueDto[]> {
    return [new CouponIssueDto()];
  }

  @Post('/claim')
  @ApiOperation({ summary: '쿠폰 발급 요청' })
  async claimCoupon(@Body() dto: ClaimCouponResDto) {
    return;
  }
}
