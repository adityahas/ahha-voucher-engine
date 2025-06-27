import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    return this.warehouseRepository.save(createWarehouseDto);
  }

  findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find();
  }

  findOne(id: string): Promise<Warehouse> {
    return this.warehouseRepository.findOneBy({ id });
  }

  update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<Warehouse> {
    return this.warehouseRepository.save({ ...updateWarehouseDto, id });
  }

  remove(id: string): Promise<void> {
    return this.warehouseRepository.delete(id).then(() => {});
  }
}
