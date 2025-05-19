import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPurchaseParamDto {
  @Type(() => Number)
  @IsPositive()
  purchaseId: number;
}

export class PurchaseReqDto {
  @ApiProperty()
  @IsPositive()
  userId: number = 1;
  @ApiProperty()
  @IsPositive()
  orderId: number = 1;
  @ApiProperty()
  @IsPositive()
  couponId?: number = 1;
}
