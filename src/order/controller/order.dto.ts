import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrderParamDto {
  @Type(() => Number)
  @IsPositive()
  orderId: number;
}

export class MakeOrderReqDto {
  @ApiProperty()
  @IsPositive()
  userId: number = 1;
  @ApiProperty()
  @IsPositive()
  optionId: number = 3;
  @ApiProperty()
  @IsPositive()
  quantity: number = 1;
  @ApiProperty()
  address: string = '광화문';
}

export class OrderDto {
  @ApiProperty()
  @IsPositive()
  orderId: number = 1;
  @ApiProperty()
  @IsPositive()
  productId: number = 1;
  @ApiProperty()
  name: string = 'RTX5090';
  @ApiProperty()
  category: string = '컴퓨터';
  @ApiProperty()
  brand: string = 'GIGABYTE';
  @ApiProperty()
  @IsPositive()
  optionId: number = 3;
  @ApiProperty()
  optionName: string = 'ROG';
  @ApiProperty()
  @IsPositive()
  quantity: number = 1;
  @ApiProperty()
  address: string = '광화문';
  @ApiProperty()
  @IsPositive()
  originalPrice: number = 1000000;
  @ApiProperty()
  status: string = '주문성공';
  @ApiProperty()
  createdAt: Date = new Date();
  @ApiProperty()
  updatedAt: Date = new Date();
}
