import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DataSource, EntityNotFoundError, Repository } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductConsumerController {
  private readonly productRepository: Repository<ProductEntity>;

  constructor(
    @Inject('PRODUCT_CONSUMER_CONNECTION')
    private readonly dataSource: DataSource,
  ) {
    this.productRepository = this.dataSource.getRepository(ProductEntity);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active products for the consumer storefront',
  })
  @ApiResponse({ status: 200, description: 'Return all active products' })
  async findAll(): Promise<ProductEntity[]> {
    return this.productRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ status: 200, description: 'Return product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductEntity> {
    try {
      return await this.productRepository.findOneOrFail({
        where: { id, is_active: true },
      });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundException(`Product ${id} not found`);
      }
      throw error;
    }
  }
}
