import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const voucher = this.voucherRepository.create(createVoucherDto);
    return this.voucherRepository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.voucherRepository.find();
  }

  async findOne(id: number): Promise<Voucher> {
    return this.voucherRepository.findOne(id);
  }

  async update(id: number, updateVoucherDto: UpdateVoucherDto): Promise<Voucher> {
    await this.voucherRepository.update(id, updateVoucherDto);
    return this.voucherRepository.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.voucherRepository.delete(id);
  }
}
