import { GoPayRewardStrategy } from './gopay-reward.strategy';
import { RewardClaimStrategyFactory } from './reward-claim-strategy-factory.service';
import { SyntheticRewardStrategy } from './synthetic-reward.strategy';

describe('RewardClaimStrategyFactory', () => {
  it('returns the synthetic strategy for synthetic sources', () => {
    const syntheticStrategy = new SyntheticRewardStrategy();
    const factory = new RewardClaimStrategyFactory(
      new GoPayRewardStrategy(),
      syntheticStrategy,
    );

    expect(factory.getStrategy('synthetic')).toBe(syntheticStrategy);
  });

  it('returns the GoPay strategy for gopay sources', () => {
    const goPayStrategy = new GoPayRewardStrategy();
    const factory = new RewardClaimStrategyFactory(
      goPayStrategy,
      new SyntheticRewardStrategy(),
    );

    expect(factory.getStrategy('gopay')).toBe(goPayStrategy);
  });

  it('throws for unsupported source types', () => {
    const factory = new RewardClaimStrategyFactory(
      new GoPayRewardStrategy(),
      new SyntheticRewardStrategy(),
    );

    expect(() => factory.getStrategy('unknown')).toThrow(
      'No strategy for type unknown',
    );
  });
});
