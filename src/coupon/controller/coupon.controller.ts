import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ClaimCouponResDto, CouponDto, CouponIssueDto } from './coupon.dto';
import { GetUserParamDto } from '../../user/controller/user.dto';
import { CouponService } from '../application/coupon.service';

@Controller('/coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Get('')
  @ApiOperation({ summary: '발급가능한 쿠폰 목록 조회' })
  async getCoupons(): Promise<CouponDto[]> {
    return this.couponService.getCouponList();
  }

  @Get(':userId')
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiOperation({ summary: '발급받은 쿠폰 목록 조회' })
  async getCouponIssuesByUser(
    @Param() params: GetUserParamDto,
  ): Promise<CouponIssueDto[]> {
    return this.couponService.getCouponIssuesByUserId(params.userId);
  }

  @Post('/claim')
  @ApiOperation({ summary: '쿠폰 발급 요청' })
  async claimCoupon(@Body() dto: ClaimCouponResDto) {
    return this.couponService.claimCoupon(dto.userId, dto.couponId);
  }
}
