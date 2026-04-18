import { Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductAdminService {
  private productRepository: Repository<ProductEntity>;

  constructor(
    @Inject('PRODUCT_ADMIN_CONNECTION')
    private dataSource: DataSource,
  ) {
    this.productRepository = this.dataSource.getRepository(ProductEntity);
  }

  create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    return this.productRepository.save(createProductDto);
  }

  findAll(): Promise<ProductEntity[]> {
    return this.productRepository.find();
  }

  findOne(id: string): Promise<ProductEntity> {
    return this.productRepository.findOneBy({ id });
  }

  update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductEntity> {
    return this.productRepository.save({ ...updateProductDto, id });
  }

  remove(id: string): Promise<void> {
    return this.productRepository.delete(id).then(() => {});
  }
}
