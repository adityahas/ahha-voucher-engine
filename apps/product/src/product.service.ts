import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
  ) {}

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
