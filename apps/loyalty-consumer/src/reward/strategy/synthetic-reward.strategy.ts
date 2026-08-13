import { Injectable } from '@nestjs/common';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { ClaimResult } from '../dto/claim-result.dto';
import { RewardClaimStrategy } from './reward-claim-strategy.interface';

@Injectable()
export class SyntheticRewardStrategy implements RewardClaimStrategy {
  async claim(
    userId: string,
    rewardItem: RewardItemEntity,
  ): Promise<ClaimResult> {
    return {
      status: 'SUCCESS',
      code: `SYNTHETIC-${rewardItem.id}-${userId}`,
    };
  }
}
