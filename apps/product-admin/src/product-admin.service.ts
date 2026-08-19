import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCategoryService } from './product-category.service';

@Injectable()
export class ProductAdminService {
  private get productRepository(): Repository<ProductEntity> {
    return this.dataSource.getRepository(ProductEntity);
  }

  constructor(
    @Inject('PRODUCT_ADMIN_CONNECTION')
    private dataSource: DataSource,
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    const { categories, ...rest } = createProductDto;

    const product = this.productRepository.create(rest);

    if (categories && categories.length > 0) {
      product.categories =
        await this.productCategoryService.findOrCreateMany(categories);
    }

    return this.productRepository.save(product);
  }

  findAll(): Promise<ProductEntity[]> {
    return this.productRepository.find();
  }

  findOne(id: string): Promise<ProductEntity> {
    return this.productRepository.findOneBy({ id });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    const { categories, ...rest } = updateProductDto;

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!product) return null;

    Object.assign(product, rest);

    if (categories) {
      product.categories =
        await this.productCategoryService.findOrCreateMany(categories);
    }

    return this.productRepository.save(product);
  }

  remove(id: string): Promise<void> {
    return this.productRepository.delete(id).then(() => {});
  }
}
