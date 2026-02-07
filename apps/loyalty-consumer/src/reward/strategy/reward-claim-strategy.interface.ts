import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { ClaimResult } from '../dto/claim-result.dto';

export interface RewardClaimStrategy {
  claim(userId: string, rewardItem: RewardItemEntity): Promise<ClaimResult>;
}
