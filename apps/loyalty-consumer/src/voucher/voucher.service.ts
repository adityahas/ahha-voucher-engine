import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { GetClaimedVoucherResponseDto } from './dto/get-claimed-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';
import { VoucherUsageEntity } from '@core/loyalty/voucher/entities/voucher-usage.entity';

@Injectable()
export class VoucherService {
  private voucherRepository: Repository<VoucherEntity>;
  private claimedVouchersRepository: Repository<VoucherClaimEntity>;
  private usageRepository: Repository<VoucherUsageEntity>;

  constructor(dataSource: DataSource) {
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
    this.claimedVouchersRepository =
      dataSource.getRepository(VoucherClaimEntity);
    this.usageRepository = dataSource.getRepository(VoucherUsageEntity);
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
        'user.core_user_id = :userId',
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
            core_user_id: userId,
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

  async claimVoucher(
    userId: string,
    voucherCode: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.voucherRepository.manager.transaction(async (manager) => {
      const user = await this.getOrCreateLoyaltyUser(userId, manager);

      const voucher = await manager.findOne(VoucherEntity, {
        where: { code: voucherCode },
        lock: { mode: 'pessimistic_write' },
      });

      if (!voucher) {
        throw new NotFoundException('Voucher not found or currently unavailable');
      }

      if (voucher.quota <= 0) {
        throw new BadRequestException('Voucher quota exhausted');
      }

      const existingClaim = await manager.findOne(VoucherClaimEntity, {
        where: {
          voucher: { code: voucherCode },
          user: { id: user.id },
        },
      });

      if (existingClaim) {
        throw new BadRequestException('You have already claimed this voucher');
      }

      const newClaim = manager.create(VoucherClaimEntity, {
        voucher: { code: voucherCode },
        user: user,
      });

      voucher.quota -= 1;

      await manager.save(VoucherClaimEntity, newClaim);
      await manager.save(VoucherEntity, voucher);

      return {
        success: true,
        message: 'Voucher claimed successfully!',
      };
    });
  }

  async useVoucher(
    coreUserId: string,
    voucherCode: string,
    manager?: EntityManager,
  ): Promise<VoucherUsageEntity> {
    const entityManager = manager || this.voucherRepository.manager;
    const user = await this.getOrCreateLoyaltyUser(coreUserId, entityManager);

    const claim = await entityManager.findOne(VoucherClaimEntity, {
      where: {
        voucher: { code: voucherCode },
        user: { id: user.id },
      },
    });

    if (!claim) {
      throw new BadRequestException('You have not claimed this voucher yet');
    }

    const existingUsage = await entityManager.findOne(VoucherUsageEntity, {
      where: {
        voucher: { code: voucherCode },
        user: { id: user.id },
      },
    });

    if (existingUsage) {
      throw new BadRequestException('Voucher has already been used');
    }

    const usage = entityManager.create(VoucherUsageEntity, {
      voucher: { code: voucherCode },
      user: user,
    });

    return entityManager.save(VoucherUsageEntity, usage);
  }

  private async getOrCreateLoyaltyUser(
    coreUserId: string,
    manager?: any,
  ): Promise<LoyaltyUserEntity> {
    const entityManager = manager || this.voucherRepository.manager;
    const repository = entityManager.getRepository(LoyaltyUserEntity);

    let user = await repository.findOne({
      where: { core_user_id: coreUserId },
    });

    if (!user) {
      user = repository.create({ core_user_id: coreUserId });
      user = await repository.save(user);
    }

    return user;
  }
}
