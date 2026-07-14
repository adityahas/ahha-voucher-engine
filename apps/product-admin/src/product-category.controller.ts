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
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('product-categories')
@UseGuards(AdminJwtGuard, AclGuard)
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Post()
  @Permissions('write:products')
  create(@Body() createProductCategoryDto: CreateProductCategoryDto) {
    return this.productCategoryService.create(createProductCategoryDto);
  }

  @Get()
  @Permissions('read:products')
  findAll() {
    return this.productCategoryService.findAll();
  }

  @Get(':id')
  @Permissions('read:products')
  findOne(@Param('id') id: string) {
    return this.productCategoryService.findOne(id);
  }

  @Patch(':id')
  @Permissions('write:products')
  update(
    @Param('id') id: string,
    @Body() updateProductCategoryDto: UpdateProductCategoryDto,
  ) {
    return this.productCategoryService.update(id, updateProductCategoryDto);
  }

  @Delete(':id')
  @Permissions('write:products')
  remove(@Param('id') id: string) {
    return this.productCategoryService.remove(id);
  }
}
