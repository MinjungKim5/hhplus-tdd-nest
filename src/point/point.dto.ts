import { ApiProperty } from '@nestjs/swagger';
import { IsPositive } from 'class-validator';

export class PointBody {
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
