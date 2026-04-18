import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { ProductCategoryEntity } from '@core/product/entities/product-category.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';

@Injectable()
export class ProductCategoryService {
  private repository: Repository<ProductCategoryEntity>;

  constructor(
    @Inject('PRODUCT_ADMIN_CONNECTION')
    private dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(ProductCategoryEntity);
  }

  async create(
    createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategoryEntity> {
    const category = this.repository.create(createProductCategoryDto);
    return this.repository.save(category);
  }

  async findAll(): Promise<ProductCategoryEntity[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<ProductCategoryEntity> {
    return this.repository.findOneBy({ id });
  }

  async update(
    id: string,
    updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryEntity> {
    await this.repository.update(id, updateProductCategoryDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Resolves a list of category names into ProductCategoryEntity instances.
   * Automatically creates categories that do not exist yet.
   */
  async findOrCreateMany(names: string[]): Promise<ProductCategoryEntity[]> {
    if (!names || names.length === 0) return [];

    // 1. Find existing
    const existingCategories = await this.repository.find({
      where: { name: In(names) },
    });

    const existingNames = existingCategories.map((c) => c.name);
    const newNames = names.filter((name) => !existingNames.includes(name));

    // 2. Create new ones if needed
    if (newNames.length > 0) {
      const newCategories = newNames.map((name) =>
        this.repository.create({ name }),
      );
      const savedNewCategories = await this.repository.save(newCategories);
      existingCategories.push(...savedNewCategories);
    }

    return existingCategories;
  }
}
