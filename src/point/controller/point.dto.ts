import { ApiProperty } from '@nestjs/swagger';
import { IsPositive } from 'class-validator';

export class ChargePointReqDto {
  @ApiProperty()
  @IsPositive()
  userId: number;
  @ApiProperty()
  @IsPositive()
  amount: number;
}

export class PointResDto {
  @ApiProperty()
  @IsPositive()
  point: number;
}
