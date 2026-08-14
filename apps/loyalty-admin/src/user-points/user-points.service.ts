import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointLedgerEntity } from '@core/loyalty/point/entities/point-ledger.entity';
import { PointService } from '@core/loyalty/point/point.service';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import {
  TierService,
  LevelUpGrantResult,
} from '@core/loyalty/tier/tier.service';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';

@Injectable()
export class UserPointsService {
  private userRepository: Repository<LoyaltyUserEntity>;
  private ledgerRepository: Repository<PointLedgerEntity>;

  constructor(
    private dataSource: DataSource,
    private pointService: PointService,
    private tierService: TierService,
  ) {
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
    this.ledgerRepository = dataSource.getRepository(PointLedgerEntity);
  }

  async getProfile(coreUserId: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getLedger(coreUserId: string, page = 0, size = 10) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
    });
    if (!user) throw new NotFoundException('User not found');
    const [data, total] = await this.ledgerRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { occurred_at: 'DESC' },
      skip: page * size,
      take: size,
    });
    return {
      code: 'SUCCESS',
      message: 'Point history retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async adjustPoints(coreUserId: string, delta: number, reason: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.dataSource.transaction(async (manager) => {
      const balance = await this.pointService.adjust(
        user,
        delta,
        reason,
        manager,
      );
      return { balance_points: balance };
    });
  }

  async assignTier(
    coreUserId: string,
    tierId: string,
  ): Promise<LevelUpGrantResult> {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');

    const tier = await this.dataSource
      .getRepository(LoyaltyTierEntity)
      .findOne({ where: { id: tierId, is_active: true } });
    if (!tier) throw new NotFoundException('Tier not found');

    if (user.tier && user.tier.id === tier.id) {
      throw new BadRequestException('User is already assigned to this tier');
    }

    return this.dataSource.transaction(async (manager) => {
      const from = user.tier;
      user.tier = tier;
      await manager.getRepository(LoyaltyUserEntity).save(user);
      await this.pointService.recordTierChange(
        user,
        from,
        tier,
        TierChangeReason.MANUAL,
        manager,
      );
      return this.tierService.grantLevelUpVoucher(user, tier, manager);
    });
  }
}
