import { Module } from '@nestjs/common';
import { ProductService } from './product.service';

import { OrderService } from './order.service';

@Module({
  providers: [ProductService, OrderService],
  exports: [ProductService, OrderService],
})
export class ProductModule {}
