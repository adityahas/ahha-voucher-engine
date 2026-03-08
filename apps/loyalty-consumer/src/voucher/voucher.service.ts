import { Injectable } from '@nestjs/common';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { DataSource, Repository } from 'typeorm';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { GetClaimedVoucherResponseDto } from './dto/get-claimed-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class VoucherService {
  private voucherRepository: Repository<VoucherEntity>;
  private claimedVouchersRepository: Repository<VoucherClaimEntity>;

  constructor(dataSource: DataSource) {
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
    this.claimedVouchersRepository =
      dataSource.getRepository(VoucherClaimEntity);
  }

  async findEligibleVouchers(
    searchCriteria: GetEligibleVoucherDto,
  ): Promise<VoucherResponseDto[]> {
    const queryBuilder = this.voucherRepository.createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.categories', 'category');

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

    // We always want to see the bindings too, but we might filter by them
    queryBuilder.leftJoinAndSelect('voucher.bindings', 'all_bindings');

    if (searchCriteria.bindings && searchCriteria.bindings.length > 0) {
      // Use a separate alias for filtering to avoid messing with joining all bindings
      queryBuilder.leftJoin('voucher.bindings', 'binding_filter');
      searchCriteria.bindings.forEach((binding, index) => {
        const whereClause = `(binding_filter.bind_type = :bindType${index} AND binding_filter.bind_value = :bindValue${index})`;
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

    const vouchers = await queryBuilder.getMany();
    return vouchers.map((voucher) => VoucherResponseDto.fromEntity(voucher));
  }

  async getClaimedVouchers(
    userId: string,
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<GetClaimedVoucherResponseDto>> {
    if (!userId) {
      throw new Error('User ID is required to fetch claimed vouchers');
    }

    const [vouchers, total] = await this.claimedVouchersRepository.findAndCount(
      {
        where: {
          user: {
            id: userId,
          },
        },
        relations: ['voucher', 'user'],
        skip: paginationDto.page * paginationDto.size,
        take: paginationDto.size,
      },
    );

    return {
      code: 'SUCCESS',
      message: 'Claimed vouchers fetched successfully',
      data: vouchers.map((value) =>
        GetClaimedVoucherResponseDto.fromEntity(value),
      ),
      pagination: {
        page: paginationDto.page,
        total: total,
        size: paginationDto.size,
      },
    };
  }
}
