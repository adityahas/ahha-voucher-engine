import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RetailerEntity } from './entities/retailer.entity';
import { CreateRetailerDto } from './dto/create-retailer.dto';
import { UpdateRetailerDto } from './dto/update-retailer.dto';

@Injectable()
export class RetailerService {
  private retailerRepository: Repository<RetailerEntity>;

  constructor(dataSource: DataSource) {
    this.retailerRepository = dataSource.getRepository(RetailerEntity);
  }

  create(createRetailerDto: CreateRetailerDto): Promise<RetailerEntity> {
    return this.retailerRepository.save(createRetailerDto);
  }

  findAll(): Promise<RetailerEntity[]> {
    return this.retailerRepository.find();
  }

  findOne(id: string): Promise<RetailerEntity> {
    return this.retailerRepository.findOneBy({ id });
  }

  update(
    id: string,
    updateRetailerDto: UpdateRetailerDto,
  ): Promise<RetailerEntity> {
    return this.retailerRepository.save({ ...updateRetailerDto, id });
  }

  remove(id: string): Promise<void> {
    return this.retailerRepository.delete(id).then(() => {});
  }
}
