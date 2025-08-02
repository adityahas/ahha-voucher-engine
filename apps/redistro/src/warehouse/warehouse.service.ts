import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseEntity } from './entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(WarehouseEntity)
    private warehouseRepository: Repository<WarehouseEntity>,
  ) {}

  create(createWarehouseDto: CreateWarehouseDto): Promise<WarehouseEntity> {
    return this.warehouseRepository.save(createWarehouseDto);
  }

  findAll(): Promise<WarehouseEntity[]> {
    return this.warehouseRepository.find();
  }

  findOne(id: string): Promise<WarehouseEntity> {
    return this.warehouseRepository.findOneBy({ id });
  }

  update(
    id: string,
    updateWarehouseDto: UpdateWarehouseDto,
  ): Promise<WarehouseEntity> {
    return this.warehouseRepository.save({ ...updateWarehouseDto, id });
  }

  remove(id: string): Promise<void> {
    return this.warehouseRepository.delete(id).then(() => {});
  }
}
