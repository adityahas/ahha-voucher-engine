import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { DataSource, Repository } from 'typeorm';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy-factory.service';

@Injectable()
export class RewardService {
  private rewardItemRepo: Repository<RewardItemEntity>;

  constructor(
    private dataSource: DataSource,
    private readonly strategyFactory: RewardClaimStrategyFactory,
  ) {
    this.rewardItemRepo = dataSource.getRepository(RewardItemEntity);
  }

  async claimReward(userId: string, rewardItemId: string) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const rewardItem = await transactionalEntityManager
          .getRepository(RewardItemEntity)
          .findOne({
            where: { id: rewardItemId },
            relations: ['source'],
          });

        if (!rewardItem) throw new NotFoundException('Reward item not found');

        if (rewardItem.stock === 0) {
          throw new BadRequestException('Reward item is out of stock');
        }

        if (rewardItem.stock !== -1) {
          rewardItem.stock--;
          await transactionalEntityManager
            .getRepository(RewardItemEntity)
            .save(rewardItem);
        }

        const strategy = this.strategyFactory.getStrategy(
          rewardItem.source.source_type,
        );
        const claimResult = await strategy.claim(userId, rewardItem);

        if (claimResult.status === 'FAILED') {
          throw new BadRequestException(
            claimResult.errorMessage || 'Reward claim failed',
          );
        }

        return claimResult;
      },
    );
  }

  findAllRewards() {
    return this.rewardItemRepo.find({
      relations: ['source'],
    });
  }
}
