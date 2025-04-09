import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductRepository, ProductRepositoryToken } from './infrastructure/product.repository.impl';
import { ProductService } from './application/product.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, { provide: ProductRepositoryToken, useClass: ProductRepository }],
})
export class ProductModule {}
