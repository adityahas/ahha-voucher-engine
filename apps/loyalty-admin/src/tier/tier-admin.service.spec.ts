import { TierAdminService } from './tier-admin.service';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from '@core/loyalty/tier/entities/tier-category-override.entity';
import { ProductCategoryEntity } from '@core/product/entities/product-category.entity';
import { CreateTierDto } from './dto/create-tier.dto';

describe('TierAdminService', () => {
  const repoMock = {
    create: jest.fn((d) => Object.assign(new LoyaltyTierEntity(), d)),
    save: jest.fn((e) => Promise.resolve(e)),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
  };
  const overrideRepoMock = {
    create: jest.fn((d) => Object.assign(new TierCategoryOverrideEntity(), d)),
    save: jest.fn((e) => Promise.resolve(e)),
    delete: jest.fn(),
  };
  const categoryRepoMock = { findOne: jest.fn() };
  const dataSourceMock = {
    getRepository: jest.fn((entity: any) => {
      if (entity === TierCategoryOverrideEntity) return overrideRepoMock;
      if (entity === ProductCategoryEntity) return categoryRepoMock;
      return repoMock;
    }),
  } as any;

  it('creates a tier', async () => {
    const service = new TierAdminService(dataSourceMock);
    const dto: CreateTierDto = {
      name: 'Gold',
      level: 3,
      min_points: 50000,
      point_multiplier: 2,
      extra_discount_percent: 5,
      is_active: true,
      exclusive_window_hours: 24,
    };
    const result = await service.create(dto);
    expect(result.name).toBe('Gold');
    expect(result.level).toBe(3);
    expect(repoMock.create).toHaveBeenCalled();
  });

  it('resolves product category override by id on create', async () => {
    categoryRepoMock.findOne.mockResolvedValue({
      id: 'cat-1',
      name: 'Food',
    });
    const service = new TierAdminService(dataSourceMock);
    const dto: CreateTierDto = {
      name: 'Gold',
      level: 3,
      min_points: 50000,
      point_multiplier: 2,
      category_overrides: [{ category_id: 'cat-1', point_multiplier: 3 }],
    };
    await service.create(dto);
    expect(categoryRepoMock.findOne).toHaveBeenCalledWith({
      where: { id: 'cat-1' },
    });
    expect(overrideRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: { id: 'cat-1', name: 'Food' },
        point_multiplier: 3,
      }),
    );
  });
});
