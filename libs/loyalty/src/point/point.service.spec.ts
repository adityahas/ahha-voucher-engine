import { PointService } from './point.service';
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import { PointEventType } from './entities/point-ledger.entity';
import {
  TierHistoryEntity,
  TierChangeReason,
} from './entities/tier-history.entity';
import { LoyaltyTierEntity } from '../tier/entities/loyalty-tier.entity';

describe('PointService', () => {
  let user: LoyaltyUserEntity;
  let ledgerSaves: any[];
  const managerMock = {
    getRepository: jest.fn(),
  } as any;

  beforeEach(() => {
    user = new LoyaltyUserEntity();
    user.id = 'u1';
    user.lifetime_points = 0;
    user.balance_points = 0;
    ledgerSaves = [];
    managerMock.getRepository.mockImplementation((entity: any) => ({
      create: (data: any) => Object.assign(new entity(), data),
      save: async (e: any) => {
        ledgerSaves.push(e);
        return e;
      },
    }));
  });

  it('earn adds to lifetime and balance and writes EARN ledger', async () => {
    const service = new PointService();
    const balance = await service.earn(
      user,
      150,
      'ORDER',
      'ord-1',
      managerMock,
    );
    expect(user.lifetime_points).toBe(150);
    expect(user.balance_points).toBe(150);
    expect(balance).toBe(150);
    expect(ledgerSaves[0].event_type).toBe(PointEventType.EARN);
    expect(ledgerSaves[0].balance_after).toBe(150);
    expect(ledgerSaves[0].reference_id).toBe('ord-1');
  });

  it('spend throws when balance is insufficient', async () => {
    const service = new PointService();
    await expect(
      service.spend(user, 10, 'REWARD_CLAIM', 'rw-1', managerMock),
    ).rejects.toThrow('Insufficient points');
  });

  it('spend deducts balance and writes SPEND ledger', async () => {
    user.lifetime_points = 150;
    user.balance_points = 150;
    const service = new PointService();
    const balance = await service.spend(
      user,
      50,
      'REWARD_CLAIM',
      'rw-1',
      managerMock,
    );
    expect(user.balance_points).toBe(100);
    expect(balance).toBe(100);
    expect(ledgerSaves[0].event_type).toBe(PointEventType.SPEND);
  });

  it('adjust rejects negative balance', async () => {
    const service = new PointService();
    await expect(
      service.adjust(user, -50, 'MANUAL', managerMock),
    ).rejects.toThrow('Insufficient points');
  });

  it('recordTierChange writes tier history', async () => {
    const to = new LoyaltyTierEntity();
    to.id = 'silver';
    const service = new PointService();
    await service.recordTierChange(
      user,
      null,
      to,
      TierChangeReason.POINTS_THRESHOLD,
      managerMock,
    );
    expect(ledgerSaves[0]).toBeInstanceOf(TierHistoryEntity);
    expect(ledgerSaves[0].to_tier.id).toBe('silver');
  });
});
