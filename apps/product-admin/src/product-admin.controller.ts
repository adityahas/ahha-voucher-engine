import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductAdminService } from './product-admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminJwtGuard, AclGuard, Permissions } from '@core/auth';

@Controller('redistro/products')
@UseGuards(AdminJwtGuard, AclGuard)
export class ProductAdminController {
  constructor(private readonly productService: ProductAdminService) {}

  @Post()
  @Permissions('write:products')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @Permissions('read:products')
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @Permissions('read:products')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Permissions('write:products')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Permissions('write:products')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
