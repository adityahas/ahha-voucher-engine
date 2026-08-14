import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetEligibleVoucherDto } from './dto/get-eligible-voucher.dto';
import {
  VoucherEntity,
  DiscountType,
  VoucherType,
  ClaimPeriod,
} from '@core/loyalty/voucher/entities/voucher.entity';
import { isWithinCurrentPeriod, resolveTimezone } from './claim-period.util';
import { DataSource, Not, In, Repository, EntityManager } from 'typeorm';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { ProductEntity } from '@core/product/entities/product.entity';
import { CalculateDiscountDto } from './dto/calculate-discount.dto';
import { GetClaimedVoucherResponseDto } from './dto/get-claimed-voucher-response.dto';
import { VoucherResponseDto } from './dto/voucher-response.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';
import { VoucherUsageEntity } from '@core/loyalty/voucher/entities/voucher-usage.entity';
import { calculateHybridPayment } from './point-payment.calculator';

@Injectable()
export class VoucherService {
  private voucherRepository: Repository<VoucherEntity>;
  private claimedVouchersRepository: Repository<VoucherClaimEntity>;
  private usageRepository: Repository<VoucherUsageEntity>;
  private userRepository: Repository<LoyaltyUserEntity>;

  constructor(dataSource: DataSource) {
    this.voucherRepository = dataSource.getRepository(VoucherEntity);
    this.claimedVouchersRepository =
      dataSource.getRepository(VoucherClaimEntity);
    this.usageRepository = dataSource.getRepository(VoucherUsageEntity);
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
  }

  async findEligibleVouchers(
    searchCriteria: GetEligibleVoucherDto,
  ): Promise<VoucherResponseDto[]> {
    const queryBuilder = this.voucherRepository
      .createQueryBuilder('voucher')
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

    const usedClaims = await this.usageRepository.find({
      where: {
        user: {
          core_user_id: userId,
        },
      },
      relations: ['claim'],
    });
    const usedClaimIds = usedClaims
      .map((usage) => usage.claim?.id)
      .filter((id): id is number => id !== undefined && id !== null);

    const where: any = {
      user: {
        core_user_id: userId,
      },
    };
    if (usedClaimIds.length > 0) {
      where.id = Not(In(usedClaimIds));
    }

    const [vouchers, total] = await this.claimedVouchersRepository.findAndCount(
      {
        where,
        relations: ['voucher', 'voucher.validities', 'user'],
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
        throw new NotFoundException(
          'Voucher not found or currently unavailable',
        );
      }

      if (voucher.quota <= 0) {
        throw new BadRequestException('Voucher quota exhausted');
      }

      const targetCoreUserIds: string[] = await manager
        .getRepository(VoucherEntity)
        .createQueryBuilder('v')
        .innerJoin('v.target_users', 'tu')
        .select('tu.core_user_id', 'core_user_id')
        .where('v.code = :code', { code: voucherCode })
        .getRawMany()
        .then((rows) => rows.map((r) => r.core_user_id));

      if (targetCoreUserIds.length > 0 && !targetCoreUserIds.includes(userId)) {
        throw new BadRequestException('Voucher is not valid for this user');
      }

      await this.assertCanClaim(manager, voucher, user);

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

  private async assertCanClaim(
    manager: EntityManager,
    voucher: VoucherEntity,
    user: LoyaltyUserEntity,
  ): Promise<void> {
    const period = voucher.claim_period ?? ClaimPeriod.ONCE;

    if (
      voucher.voucher_type === VoucherType.UNIQUE_CODE ||
      period === ClaimPeriod.ONCE
    ) {
      const existingClaim = await manager.findOne(VoucherClaimEntity, {
        where: {
          voucher: { code: voucher.code },
          user: { id: user.id },
        },
      });
      if (existingClaim) {
        throw new BadRequestException('You have already claimed this voucher');
      }
      return;
    }

    if (period === ClaimPeriod.FREE) {
      return;
    }

    const latestClaim = await manager.findOne(VoucherClaimEntity, {
      where: {
        voucher: { code: voucher.code },
        user: { id: user.id },
      },
      order: { created_at: 'DESC' },
    });

    if (
      latestClaim &&
      isWithinCurrentPeriod(
        period,
        latestClaim.created_at,
        new Date(),
        resolveTimezone(user.timezone),
      )
    ) {
      throw new BadRequestException(
        'You have already claimed this voucher within the current period',
      );
    }
  }

  async useVoucher(
    coreUserId: string,
    voucherCode: string,
    manager?: EntityManager,
  ): Promise<VoucherUsageEntity> {
    const entityManager = manager || this.voucherRepository.manager;
    const user = await this.getOrCreateLoyaltyUser(coreUserId, entityManager);

    const claims = await entityManager.getRepository(VoucherClaimEntity).find({
      where: {
        voucher: { code: voucherCode },
        user: { id: user.id },
      },
      order: { created_at: 'ASC' },
    });

    if (claims.length === 0) {
      throw new BadRequestException('You have not claimed this voucher yet');
    }

    const usages = await entityManager.getRepository(VoucherUsageEntity).find({
      where: {
        voucher: { code: voucherCode },
        user: { id: user.id },
      },
      relations: ['claim'],
    });

    const usedClaimIds = new Set(
      usages.map((u) => u.claim?.id).filter((id): id is number => !!id),
    );

    // Each claim is one usable ticket: consume the oldest unused one.
    // The unique index on voucher_usages.claim_id guards against two
    // concurrent purchases consuming the same claim (DB-enforced).
    const availableClaim = claims.find((c) => !usedClaimIds.has(c.id));

    if (!availableClaim) {
      throw new BadRequestException('Voucher has already been used');
    }

    const usage = entityManager.create(VoucherUsageEntity, {
      voucher: { code: voucherCode },
      user: user,
      claim: { id: availableClaim.id },
    });

    return entityManager.save(VoucherUsageEntity, usage);
  }

  async validateAndCalculateDiscount(
    voucherCode: string,
    subtotal: number,
    userId: string,
    productId?: string,
    categoryNames: string[] = [],
  ): Promise<{
    isValid: boolean;
    discountAmount: number;
    finalPrice: number;
    message: string;
  }> {
    const voucher = await this.voucherRepository.findOne({
      where: { code: voucherCode },
      relations: ['bindings', 'validities', 'categories', 'target_users'],
    });

    if (!voucher) {
      return {
        isValid: false,
        discountAmount: 0,
        finalPrice: subtotal,
        message: 'Voucher not found',
      };
    }

    // 1. Check Quota
    if (voucher.quota <= 0) {
      return {
        isValid: false,
        discountAmount: 0,
        finalPrice: subtotal,
        message: 'Voucher quota exhausted',
      };
    }

    // 2. Check Validity Dates
    const now = new Date();
    const activeValidity = voucher.validities.find((v) => {
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      return now >= start && now <= end;
    });

    if (voucher.validities.length > 0 && !activeValidity) {
      return {
        isValid: false,
        discountAmount: 0,
        finalPrice: subtotal,
        message: 'Voucher is not valid at this time',
      };
    }

    // 3. Check Target Users
    if (voucher.target_users.length > 0) {
      const isTargeted = voucher.target_users.some(
        (u) => u.core_user_id === userId,
      );
      if (!isTargeted) {
        return {
          isValid: false,
          discountAmount: 0,
          finalPrice: subtotal,
          message: 'Voucher is not valid for this user',
        };
      }
    }

    // 3b. Check Tier Bindings
    const tierBindings = voucher.bindings.filter((b) => b.bind_type === 'tier');
    if (tierBindings.length > 0) {
      const user = await this.userRepository.findOne({
        where: { core_user_id: userId },
        relations: ['tier'],
      });
      const userTierId = user?.tier?.id;
      const isTierBound = tierBindings.some((b) => b.bind_value === userTierId);
      if (!isTierBound) {
        return {
          isValid: false,
          discountAmount: 0,
          finalPrice: subtotal,
          message: 'Voucher is not valid for this user',
        };
      }
    }

    // 4. Check Bindings (Product/Category) — tier bindings handled in 3b
    const nonTierBindings = voucher.bindings.filter(
      (b) => b.bind_type !== 'tier',
    );
    if (nonTierBindings.length > 0) {
      const isBound = nonTierBindings.some((b) => {
        if (
          b.bind_type === 'product' &&
          productId &&
          b.bind_value === productId
        )
          return true;
        if (b.bind_type === 'category' && categoryNames.includes(b.bind_value))
          return true;
        return false;
      });

      if (!isBound) {
        return {
          isValid: false,
          discountAmount: 0,
          finalPrice: subtotal,
          message: 'Voucher is not valid for this product or category',
        };
      }
    }

    // 4b. Require an unused claim (1 use per claim)
    const claims = await this.claimedVouchersRepository.find({
      where: {
        voucher: { code: voucherCode },
        user: { core_user_id: userId },
      },
    });

    if (claims.length === 0) {
      return {
        isValid: false,
        discountAmount: 0,
        finalPrice: subtotal,
        message: 'You have not claimed this voucher yet',
      };
    }

    const usages = await this.usageRepository.find({
      where: {
        voucher: { code: voucherCode },
        user: { core_user_id: userId },
      },
      relations: ['claim'],
    });
    const usedClaimIds = new Set(
      usages.map((u) => u.claim?.id).filter((id): id is number => !!id),
    );
    const hasAvailableClaim = claims.some((c) => !usedClaimIds.has(c.id));
    if (!hasAvailableClaim) {
      return {
        isValid: false,
        discountAmount: 0,
        finalPrice: subtotal,
        message: 'Voucher has already been used',
      };
    }

    // 5. Calculate Discount
    let discountAmount = 0;
    if (voucher.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = (subtotal * Number(voucher.discount_value)) / 100;
    } else {
      discountAmount = Number(voucher.discount_value);
    }

    // Cap discount to subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return {
      isValid: true,
      discountAmount,
      finalPrice: subtotal - discountAmount,
      message: 'Voucher applied successfully',
    };
  }

  async calculateDiscount(
    dto: CalculateDiscountDto,
    userId: string,
    pointToCurrencyRate?: number,
  ) {
    const entityManager = this.voucherRepository.manager;
    const product = await entityManager.findOne(ProductEntity, {
      where: { id: dto.product_id, is_active: true },
      relations: ['categories'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const subtotal = product.price * dto.quantity;
    const categoryNames = product.categories?.map((c) => c.name) || [];

    const voucherResult = await this.validateAndCalculateDiscount(
      dto.voucher_code,
      subtotal,
      userId,
      product.id,
      categoryNames,
    );

    const user = await this.userRepository.findOne({
      where: { core_user_id: userId },
    });
    const breakdown = calculateHybridPayment({
      subtotal,
      voucher_discount_amount: voucherResult.discountAmount,
      user_balance_points: Number(user?.balance_points ?? 0),
      point_to_currency_rate: pointToCurrencyRate,
      points_to_use: dto.points_to_use,
    });
    return { ...voucherResult, ...breakdown };
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
