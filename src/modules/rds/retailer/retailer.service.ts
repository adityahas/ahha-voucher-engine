import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retailer } from './entities/retailer.entity';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Injectable()
export class RetailerService {
  constructor(
    @InjectRepository(Retailer)
    private retailerRepository: Repository<Retailer>,
  ) {}

  create(createRetailerDto: CreateRetailerDto): Promise<Retailer> {
    return this.retailerRepository.save(createRetailerDto);
  }

  findAll(): Promise<Retailer[]> {
    return this.retailerRepository.find();
  }

  findOne(id: string): Promise<Retailer> {
    return this.retailerRepository.findOneBy({ id });
  }

  update(id: string, updateRetailerDto: UpdateRetailerDto): Promise<Retailer> {
    return this.retailerRepository.save({ ...updateRetailerDto, id });
  }

  remove(id: string): Promise<void> {
    return this.retailerRepository.delete(id).then(() => {});
  }
}
