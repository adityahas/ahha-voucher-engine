import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

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
}
