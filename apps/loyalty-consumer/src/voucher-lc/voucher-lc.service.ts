import { Injectable } from '@nestjs/common';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { DataSource, Repository } from 'typeorm';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { GetClaimedVoucherResponseDto } from './dto/get-claimed-voucher-response.dto';

@Injectable()
export class VoucherLcService {
  private voucherRepository: Repository<VoucherEntity>;
  private claimedVouchersRepository: Repository<VoucherClaimEntity>;

  constructor(dataSource: DataSource) {
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
    this.claimedVouchersRepository =
      dataSource.getRepository(VoucherClaimEntity);
  }

  async getEligibleVouchers(
    searchCriteria: GetEligibleVoucherDto,
  ): Promise<VoucherEntity[]> {
    const queryBuilder = this.voucherRepository.createQueryBuilder('voucher');
    let whereClauseAdded = false;

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
        if (!whereClauseAdded) {
          whereClauseAdded = true;
          queryBuilder.where(whereClause, whereValue);
        } else {
          queryBuilder.orWhere(whereClause, whereValue);
        }
      });
    }

    return queryBuilder.getMany();
  }

  async getClaimedVouchers(
    userId: string,
  ): Promise<GetClaimedVoucherResponseDto[]> {
    if (!userId) {
      throw new Error('User ID is required to fetch claimed vouchers');
    }
    const vouchers = await this.claimedVouchersRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['voucher', 'user'],
    });
    return vouchers.map((value) =>
      GetClaimedVoucherResponseDto.fromEntity(value),
    );
  }
}
