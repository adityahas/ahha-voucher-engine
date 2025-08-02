import { Injectable, NotFoundException } from '@nestjs/common';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { DataSource, Repository } from 'typeorm';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy.factory';

@Injectable()
export class RewardClaimService {
  private rewardItemRepo: Repository<RewardItemEntity>;

  constructor(
    dataSource: DataSource,
    private readonly strategyFactory: RewardClaimStrategyFactory,
  ) {
    this.rewardItemRepo = dataSource.getRepository(RewardItemEntity);
  }

  async claimReward(userId: string, rewardItemId: string) {
    const rewardItem = await this.rewardItemRepo.findOne({
      where: { id: rewardItemId },
      relations: ['source'],
    });

    if (!rewardItem) throw new NotFoundException('Reward item not found');

    const strategy = this.strategyFactory.getStrategy(
      rewardItem.source.source_type,
    );
    return strategy.claim(userId, rewardItem);
  }
}
