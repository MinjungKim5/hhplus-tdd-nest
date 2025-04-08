import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';

@Module({
  controllers: [ProductController],
})
export class ProductModule {}
