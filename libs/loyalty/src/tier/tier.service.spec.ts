import { TierService } from './tier.service';
import { LoyaltyTierEntity } from './entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from './entities/tier-category-override.entity';

describe('TierService', () => {
  const tier = new LoyaltyTierEntity();
  tier.id = 't1';
  tier.name = 'Gold';
  tier.level = 3;
  tier.min_points = 50000;
  tier.point_multiplier = 2;

  const managerMock = {
    getRepository: jest.fn().mockReturnValue({}),
  } as any;

  it('returns tier multiplier when no category override matches', async () => {
    managerMock.getRepository.mockReturnValue({
      find: jest.fn().mockResolvedValue([]),
    });
    const service = new TierService();
    const result = await service.getMultiplierFor(tier, ['Food'], managerMock);
    expect(result).toBe(2);
  });

  it('returns category override multiplier when a category matches', async () => {
    const override = new TierCategoryOverrideEntity();
    override.category = { slug: 'food' } as any;
    override.point_multiplier = 3;
    managerMock.getRepository.mockReturnValue({
      find: jest.fn().mockResolvedValue([override]),
    });
    const service = new TierService();
    const result = await service.getMultiplierFor(
      tier,
      ['Food', 'Drinks'],
      managerMock,
    );
    expect(result).toBe(3);
  });

  it('finds highest active tier at or below lifetime points', async () => {
    const bronze = new LoyaltyTierEntity();
    bronze.id = 'b';
    bronze.level = 1;
    bronze.min_points = 0;
    bronze.is_active = true;
    const silver = new LoyaltyTierEntity();
    silver.id = 's';
    silver.level = 2;
    silver.min_points = 10000;
    silver.is_active = true;
    const gold = new LoyaltyTierEntity();
    gold.id = 'g';
    gold.level = 3;
    gold.min_points = 50000;
    gold.is_active = true;

    managerMock.getRepository.mockReturnValue({
      find: jest.fn().mockResolvedValue([bronze, silver, gold]),
    });
    const service = new TierService();
    const result = await service.findHighestTierAtOrBelow(15000, managerMock);
    expect(result?.id).toBe('s');
  });
});
