import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsPositive } from 'class-validator';

export class CouponDto {
  @ApiProperty()
  @IsPositive()
  couponId: number = 1;
  @ApiProperty()
  couponType: string = 'amount';
  @ApiProperty()
  @IsPositive()
  benefit: number = 500;
  @ApiProperty()
  @IsPositive()
  maxDiscount: number = 500;
  @ApiProperty()
  @IsPositive()
  minPrice: number = 1000;
  @ApiProperty()
  @IsDate()
  dueDate: Date = new Date();
}

export class CouponIssueDto extends CouponDto {
  @ApiProperty()
  @IsBoolean()
  used: boolean = true;
  @ApiProperty()
  @IsDate()
  createdAt: Date = new Date();
}

export class ClaimCouponResDto {
  @ApiProperty()
  @IsPositive()
  couponId: number;
  @ApiProperty()
  @IsPositive()
  userId: number;
}
