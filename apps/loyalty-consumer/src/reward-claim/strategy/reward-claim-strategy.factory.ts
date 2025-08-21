import { GoPayRewardStrategy } from './gopay-reward.strategy';
import { Injectable } from '@nestjs/common';
import { RewardClaimStrategy } from './reward-claim-strategy.interface';

@Injectable()
export class RewardClaimStrategyFactory {
  constructor(private readonly goPayStrategy: GoPayRewardStrategy) {}

  getStrategy(sourceType: string): RewardClaimStrategy {
    switch (sourceType) {
      case 'gopay':
        return this.goPayStrategy;
      default:
        throw new Error(`No strategy for type ${sourceType}`);
    }
  }
}
