import { ApiProperty } from '@nestjs/swagger';
import { IsPositive } from 'class-validator';

export class Product {
  productId: number;
  name: string;
  category: string;
  brand: string;
}

export class ProductOption extends Product {
  optionId: number;
  optionName: string;
  price: number;
  stock: number;
}
