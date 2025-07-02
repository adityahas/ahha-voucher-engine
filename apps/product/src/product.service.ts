import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  create(createProductDto: CreateProductDto): Promise<Product> {
    return this.productRepository.save(createProductDto);
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  findOne(id: string): Promise<Product> {
    return this.productRepository.findOneBy({ id });
  }

  update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    return this.productRepository.save({ ...updateProductDto, id });
  }

  remove(id: string): Promise<void> {
    return this.productRepository.delete(id).then(() => {});
  }
}
