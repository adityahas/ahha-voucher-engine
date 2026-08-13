import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { SyntheticRewardStrategy } from './synthetic-reward.strategy';

describe('SyntheticRewardStrategy', () => {
  it('returns a deterministic synthetic claim code without network access', async () => {
    const strategy = new SyntheticRewardStrategy();

    await expect(
      strategy.claim('user-456', { id: 'reward-123' } as RewardItemEntity),
    ).resolves.toEqual({
      status: 'SUCCESS',
      code: 'SYNTHETIC-reward-123-user-456',
    });
  });
});
