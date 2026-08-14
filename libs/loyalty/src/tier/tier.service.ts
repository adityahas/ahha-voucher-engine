import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LoyaltyTierEntity } from './entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from './entities/tier-category-override.entity';
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import { VoucherEntity } from '../voucher/entities/voucher.entity';
import { VoucherClaimEntity } from '../voucher/entities/voucher-claim.entity';

@Injectable()
export class TierService {
  async getMultiplierFor(
    tier: LoyaltyTierEntity,
    categoryNames: string[],
    manager: EntityManager,
  ): Promise<number> {
    if (!categoryNames || categoryNames.length === 0) {
      return Number(tier.point_multiplier);
    }
    const overrides = await manager
      .getRepository(TierCategoryOverrideEntity)
      .find({
        where: { tier: { id: tier.id } },
        relations: ['category'],
      });
    const match = overrides.find((o) =>
      categoryNames.some(
        (name) => o.category.name.toLowerCase() === name.toLowerCase(),
      ),
    );
    return match
      ? Number(match.point_multiplier)
      : Number(tier.point_multiplier);
  }

  async findHighestTierAtOrBelow(
    lifetimePoints: number,
    manager: EntityManager,
  ): Promise<LoyaltyTierEntity | null> {
    const tiers = await manager.getRepository(LoyaltyTierEntity).find({
      where: { is_active: true },
      order: { min_points: 'DESC' },
    });
    const sorted = [...tiers].sort(
      (a, b) => Number(b.min_points) - Number(a.min_points),
    );
    return sorted.find((t) => Number(t.min_points) <= lifetimePoints) || null;
  }

  async findLowestActiveTier(
    manager: EntityManager,
  ): Promise<LoyaltyTierEntity | null> {
    return manager.getRepository(LoyaltyTierEntity).findOne({
      where: { is_active: true },
      order: { min_points: 'ASC' },
    });
  }

  async grantLevelUpVoucher(
    user: LoyaltyUserEntity,
    targetTier: LoyaltyTierEntity,
    manager: EntityManager,
  ): Promise<LevelUpGrantResult> {
    const code = targetTier.level_up_voucher_code;
    if (!code) {
      return { granted: false, message: 'no-voucher-configured' };
    }

    const voucherRepo = manager.getRepository(VoucherEntity);
    const claimRepo = manager.getRepository(VoucherClaimEntity);

    const existing = await claimRepo.findOne({
      where: { voucher: { code }, user: { id: user.id } },
    });
    if (existing) {
      return { granted: false, message: 'already-claimed' };
    }

    const voucher = await voucherRepo.findOne({
      where: { code },
      lock: { mode: 'pessimistic_write' },
    });
    if (!voucher) {
      return { granted: false, message: 'voucher-missing' };
    }
    if (voucher.quota <= 0) {
      return { granted: false, message: 'quota-exhausted' };
    }

    const claim = claimRepo.create({ voucher: { code }, user });
    voucher.quota -= 1;

    await claimRepo.save(claim);
    await voucherRepo.save(voucher);

    return { granted: true, voucherCode: code, message: 'granted' };
  }
}

export type LevelUpGrantResult = {
  granted: boolean;
  voucherCode?: string;
  message:
    | 'no-voucher-configured'
    | 'already-claimed'
    | 'voucher-missing'
    | 'quota-exhausted'
    | 'granted';
};
