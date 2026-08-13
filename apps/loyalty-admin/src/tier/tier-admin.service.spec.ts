import { TierAdminService } from './tier-admin.service';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { CreateTierDto } from './dto/create-tier.dto';

describe('TierAdminService', () => {
  const repoMock = {
    create: jest.fn((d) => Object.assign(new LoyaltyTierEntity(), d)),
    save: jest.fn((e) => Promise.resolve(e)),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
  };
  const dataSourceMock = { getRepository: jest.fn(() => repoMock) } as any;

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
});
