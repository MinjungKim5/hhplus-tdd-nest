import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductParamDto {
  @Type(() => Number)
  @IsPositive()
  productId: number;
}

export class SortDto {
  @IsOptional()
  @IsIn(['best-selling'])
  sort?: string;
}
export class ProductResDto {
  @ApiProperty()
  @IsPositive()
  productId: number = 1;
  @ApiProperty()
  name: string = 'RTX5090';
  @ApiProperty()
  category: string = '컴퓨터';
  @ApiProperty()
  brand: string = 'GIGABYTE';
}

export class ProductOptionResDto extends ProductResDto {
  @ApiProperty()
  @IsPositive()
  optionId: number = 3;
  @ApiProperty()
  optionName: string = 'ROG';
  @ApiProperty()
  @IsPositive()
  price: number = 1000000;
  @ApiProperty()
  @IsPositive()
  stock: number = 10;
}
