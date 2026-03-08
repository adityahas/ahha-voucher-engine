import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VoucherBindingEntity } from '@core/loyalty/voucher/entities/voucher-binding.entity';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { CreateVoucherBindingDto } from './dto/create-voucher-binding.dto';
import { UpdateVoucherBindingDto } from './dto/update-voucher-binding.dto';

@Injectable()
export class VoucherBindingService {
  private repository: Repository<VoucherBindingEntity>;
  private voucherRepository: Repository<VoucherEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(VoucherBindingEntity);
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
  }

  async create(
    voucherId: string,
    createDto: CreateVoucherBindingDto,
  ): Promise<VoucherBindingEntity> {
    const voucher = await this.voucherRepository.findOne({
      where: [{ code: voucherId }],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${voucherId} not found`);
    }

    const binding = this.repository.create({
      ...createDto,
      voucher,
    });

    return this.repository.save(binding);
  }

  async findAll(voucherId: string): Promise<VoucherBindingEntity[]> {
    return this.repository.find({
      where: {
        voucher: { code: voucherId },
      },
    });
  }

  async findOne(id: number): Promise<VoucherBindingEntity> {
    const binding = await this.repository.findOne({
      where: { id },
    });

    if (!binding) {
      throw new NotFoundException(`Voucher binding with id ${id} not found`);
    }

    return binding;
  }

  async update(
    id: number,
    updateDto: UpdateVoucherBindingDto,
  ): Promise<VoucherBindingEntity> {
    const binding = await this.findOne(id);
    Object.assign(binding, updateDto);
    return this.repository.save(binding);
  }

  async remove(voucherId: string, id: number): Promise<void> {
    const binding = await this.repository.findOne({
      where: {
        id,
        voucher: { code: voucherId },
      },
    });

    if (!binding) {
      throw new NotFoundException(
        `Voucher binding with id ${id} not found for voucher ${voucherId}`,
      );
    }

    await this.repository.remove(binding);
  }
}
