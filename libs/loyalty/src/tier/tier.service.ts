import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LoyaltyTierEntity } from './entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from './entities/tier-category-override.entity';

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
}
