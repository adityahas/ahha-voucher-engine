import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VoucherValidityEntity } from '@core/loyalty/voucher/entities/voucher-validity.entity';
import { CreateVoucherValidityDto } from './dto/create-voucher-validity.dto';
import { UpdateVoucherValidityDto } from './dto/update-voucher-validity.dto';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';

@Injectable()
export class VoucherValidityService {
  private validityRepository: Repository<VoucherValidityEntity>;
  private voucherRepository: Repository<VoucherEntity>;

  constructor(private dataSource: DataSource) {
    this.validityRepository = dataSource.getRepository(VoucherValidityEntity);
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
  }

  async create(voucherId: string, createDto: CreateVoucherValidityDto): Promise<VoucherValidityEntity> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${voucherId} not found`);
    }

    const validity = this.validityRepository.create({
      ...createDto,
      voucher,
    });

    return this.validityRepository.save(validity);
  }

  async findAll(voucherId: string): Promise<VoucherValidityEntity[]> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${voucherId} not found`);
    }

    return this.validityRepository.find({
      where: { voucher: { code: voucherId } },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(voucherId: string, id: number): Promise<VoucherValidityEntity> {
    const validity = await this.validityRepository.findOne({
      where: { id, voucher: { code: voucherId } },
    });

    if (!validity) {
      throw new NotFoundException(`VoucherValidity with ID ${id} acting on Voucher ${voucherId} not found`);
    }

    return validity;
  }

  async update(voucherId: string, id: number, updateDto: UpdateVoucherValidityDto): Promise<VoucherValidityEntity> {
    const validity = await this.findOne(voucherId, id);
    Object.assign(validity, updateDto);
    return this.validityRepository.save(validity);
  }

  async remove(voucherId: string, id: number): Promise<void> {
    const validity = await this.findOne(voucherId, id);
    await this.validityRepository.remove(validity);
  }
}

