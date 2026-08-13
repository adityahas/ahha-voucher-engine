import { GoPayRewardStrategy } from './gopay-reward.strategy';
import { Injectable } from '@nestjs/common';
import { RewardClaimStrategy } from './reward-claim-strategy.interface';
import { SyntheticRewardStrategy } from './synthetic-reward.strategy';

@Injectable()
export class RewardClaimStrategyFactory {
  constructor(
    private readonly goPayStrategy: GoPayRewardStrategy,
    private readonly syntheticStrategy: SyntheticRewardStrategy,
  ) {}

  getStrategy(sourceType: string): RewardClaimStrategy {
    switch (sourceType) {
      case 'gopay':
        return this.goPayStrategy;
      case 'synthetic':
        return this.syntheticStrategy;
      default:
        throw new Error(`No strategy for type ${sourceType}`);
    }
  }
}
