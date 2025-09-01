import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { ProductAdminService } from './product-admin.service';
import { ProductAdminController } from './product-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  providers: [ProductAdminService],
  controllers: [ProductAdminController],
  exports: [ProductAdminService],
})
export class ProductAdminModule {}
