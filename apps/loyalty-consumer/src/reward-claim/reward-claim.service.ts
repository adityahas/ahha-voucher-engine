import { Injectable, NotFoundException } from '@nestjs/common';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { Repository } from 'typeorm';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy.factory';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class RewardClaimService {
  constructor(
    @InjectRepository(RewardItemEntity)
    private readonly rewardItemRepo: Repository<RewardItemEntity>,
    private readonly strategyFactory: RewardClaimStrategyFactory,
  ) {}

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
