import { Injectable } from '@nestjs/common';
import { RewardClaimStrategy } from './reward-claim-strategy.interface';
import { RewardItemEntity } from '../../reward-item/entities/reward-item.entity';
import { ClaimResult } from '../dto/claim-result.dto';
import axios from 'axios';

@Injectable()
export class GoPayRewardStrategy implements RewardClaimStrategy {
  async claim(
    userId: string,
    rewardItem: RewardItemEntity,
  ): Promise<ClaimResult> {
    const response = await axios.post(
      rewardItem.source.api_endpoint,
      {
        userId,
        rewardItemId: rewardItem.id,
      },
      {
        headers: { Authorization: `Bearer ${rewardItem.source.apiKey}` },
      },
    );

    if (response.status !== 200) {
      return {
        status: 'FAILED',
        errorMessage: response.data.message,
      };
    }

    return {
      status: 'SUCCESS',
      code: response.data.voucherCode,
    };
  }
}
