import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointLedgerEntity } from '@core/loyalty/point/entities/point-ledger.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';

@Injectable()
export class PointsService {
  private userRepository: Repository<LoyaltyUserEntity>;
  private ledgerRepository: Repository<PointLedgerEntity>;
  private tierRepository: Repository<LoyaltyTierEntity>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
    this.ledgerRepository = dataSource.getRepository(PointLedgerEntity);
    this.tierRepository = dataSource.getRepository(LoyaltyTierEntity);
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: userId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');

    const tiers = await this.tierRepository.find({
      where: { is_active: true },
      order: { min_points: 'ASC' },
    });
    const nextTier =
      tiers.find((t) => Number(t.min_points) > Number(user.lifetime_points)) ||
      null;

    return {
      tier: user.tier,
      lifetime_points: user.lifetime_points,
      balance_points: user.balance_points,
      next_tier: nextTier,
    };
  }

  async getHistory(userId: string, page = 0, size = 10) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: userId },
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
}
