import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { CreateVoucherCategoryDto } from './dto/create-voucher-category.dto';
import { UpdateVoucherCategoryDto } from './dto/update-voucher-category.dto';

@Injectable()
export class VoucherCategoryService {
  private voucherCategoryRepository: Repository<VoucherCategoryEntity>;

  constructor(dataSource: DataSource) {
    this.voucherCategoryRepository = dataSource.getRepository(
      VoucherCategoryEntity,
    );
  }

  async findAll(paginationDto: BasePaginationDto) {
    const { page, size } = paginationDto;
    const [data, total] = await this.voucherCategoryRepository.findAndCount({
      skip: page * size,
      take: size,
    });
    return { data, total, page, size };
  }

  async create(createVoucherCategoryDto: CreateVoucherCategoryDto) {
    const voucherCategory = this.voucherCategoryRepository.create(
      createVoucherCategoryDto,
    );
    return await this.voucherCategoryRepository.save(voucherCategory);
  }

  async findOne(id: string) {
    return await this.voucherCategoryRepository.findOne({
      where: { slug: id },
    });
  }

  async findBySlug(slug: string) {
    return await this.voucherCategoryRepository.findOne({ where: { slug } });
  }

  async update(id: string, updateVoucherCategoryDto: UpdateVoucherCategoryDto) {
    const voucherCategory = await this.findOne(id);
    if (!voucherCategory) {
      return null;
    }

    Object.assign(voucherCategory, updateVoucherCategoryDto);
    return await this.voucherCategoryRepository.save(voucherCategory);
  }

  async remove(id: string) {
    const voucherCategory = await this.findOne(id);
    if (!voucherCategory) {
      return null;
    }

    return await this.voucherCategoryRepository.softDelete(id);
  }
}
