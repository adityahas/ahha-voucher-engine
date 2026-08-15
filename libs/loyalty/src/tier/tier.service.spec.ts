import { TierService } from './tier.service';
import { LoyaltyTierEntity } from './entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from './entities/tier-category-override.entity';
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import { VoucherClaimEntity } from '../voucher/entities/voucher-claim.entity';

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
    override.category = { name: 'food' } as any;
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

describe('TierService.grantLevelUpVoucher', () => {
  const user = new LoyaltyUserEntity();
  user.id = 'u1';

  function makeService(voucherRepo: any, claimRepo: any) {
    const manager = {
      getRepository: jest.fn((entity: any) => {
        if (entity === VoucherClaimEntity) return claimRepo;
        return voucherRepo;
      }),
    };
    return { service: new TierService(), manager };
  }

  it('returns no-voucher-configured when the tier has no voucher code', async () => {
    const { service, manager } = makeService({}, {});
    const tier = new LoyaltyTierEntity();
    tier.id = 't1';
    tier.level_up_voucher_code = null;

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(result).toEqual({
      granted: false,
      message: 'no-voucher-configured',
    });
  });

  it('returns already-claimed when a claim row already exists for the code', async () => {
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue({ code: 'GOLD2030', quota: 5 }),
    };
    const claimRepo = { findOne: jest.fn().mockResolvedValue({ id: 9 }) };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'GOLD2030';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(claimRepo.findOne).toHaveBeenCalledWith({
      where: { voucher: { code: 'GOLD2030' }, user: { id: 'u1' } },
    });
    expect(result).toEqual({ granted: false, message: 'already-claimed' });
  });

  it('locks the voucher row with pessimistic_write before checking claims', async () => {
    const voucher = { code: 'GOLD2030', quota: 5 };
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue(voucher),
      save: jest.fn().mockResolvedValue(voucher),
    };
    const claimRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((partial: any) => partial),
      save: jest.fn().mockResolvedValue({}),
    };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'GOLD2030';

    await service.grantLevelUpVoucher(user, tier, manager as any);

    expect(voucherRepo.findOne).toHaveBeenCalledWith({
      where: { code: 'GOLD2030' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(voucherRepo.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      claimRepo.findOne.mock.invocationCallOrder[0],
    );
  });

  it('returns voucher-missing when the configured code no longer exists', async () => {
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const claimRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'DELETE ME';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(result).toEqual({ granted: false, message: 'voucher-missing' });
  });

  it('returns quota-exhausted without saving when quota is zero', async () => {
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue({ code: 'X', quota: 0 }),
    };
    const claimRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'X';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(result).toEqual({ granted: false, message: 'quota-exhausted' });
  });

  it('creates a claim, decrements quota, and reports granted', async () => {
    const voucher = { code: 'GOLD2030', quota: 5 };
    const voucherRepo = {
      findOne: jest.fn().mockResolvedValue(voucher),
      save: jest.fn().mockResolvedValue(voucher),
    };
    const claimRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((partial: any) => partial),
      save: jest.fn().mockResolvedValue({}),
    };
    const { service, manager } = makeService(voucherRepo, claimRepo);
    const tier = new LoyaltyTierEntity();
    tier.level_up_voucher_code = 'GOLD2030';

    const result = await service.grantLevelUpVoucher(
      user,
      tier,
      manager as any,
    );

    expect(claimRepo.create).toHaveBeenCalledWith({
      voucher: { code: 'GOLD2030' },
      user: expect.objectContaining({ id: 'u1' }),
    });
    expect(claimRepo.save).toHaveBeenCalled();
    expect(voucherRepo.save).toHaveBeenCalled();
    expect(voucher.quota).toBe(4);
    expect(result).toEqual({
      granted: true,
      voucherCode: 'GOLD2030',
      message: 'granted',
    });
  });
});
