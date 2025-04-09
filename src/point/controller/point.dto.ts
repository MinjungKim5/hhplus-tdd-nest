import { ApiProperty } from '@nestjs/swagger';
import { IsPositive } from 'class-validator';
import { TransactionType } from '../domain/point';

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

export class PointHistoryResDto {
  @ApiProperty()
  @IsPositive()
  id: number;
  @ApiProperty()
  type: TransactionType;
  @ApiProperty()
  @IsPositive()
  amount: number;
  @ApiProperty()
  createdAt: Date;
}
