import { Injectable } from '@nestjs/common';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class VoucherLcService {
  private voucherRepository: Repository<VoucherEntity>;

  constructor(dataSource: DataSource) {
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
  }

  async getEligibleVouchers(
    searchCriteria: GetVoucherEligibleVoucherDto,
  ): Promise<VoucherEntity[]> {
    const queryBuilder = this.voucherRepository.createQueryBuilder('voucher');
    let isWhereClauseAdded = false;

    if (searchCriteria.user_id) {
      queryBuilder.leftJoinAndSelect(
        'voucher.target_users',
        'user',
        'user.id = :userId',
        {
          userId: searchCriteria.user_id,
        },
      );
    }

    if (searchCriteria.bindings && searchCriteria.bindings.length > 0) {
      queryBuilder.leftJoinAndSelect('voucher.bindings', 'binding');
      searchCriteria.bindings.forEach((binding, index) => {
        const whereClause = `(binding.bind_type = :bindType${index} AND binding.bind_value = :bindValue${index})`;
        const whereValue = {
          [`bindType${index}`]: binding.bind_type,
          [`bindValue${index}`]: binding.bind_value,
        };
        if (!isWhereClauseAdded) {
          isWhereClauseAdded = true;
          queryBuilder.where(whereClause, whereValue);
        } else {
          queryBuilder.orWhere(whereClause, whereValue);
        }
      });
    }

    return queryBuilder.getMany();
  }
}
