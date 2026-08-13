import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointService } from '@core/loyalty/point/point.service';
import { DataSource, Repository } from 'typeorm';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy-factory.service';

@Injectable()
export class RewardService {
  private rewardItemRepo: Repository<RewardItemEntity>;
  private userRepo: Repository<LoyaltyUserEntity>;

  constructor(
    private dataSource: DataSource,
    private readonly strategyFactory: RewardClaimStrategyFactory,
    private readonly pointService: PointService,
  ) {
    this.rewardItemRepo = dataSource.getRepository(RewardItemEntity);
    this.userRepo = dataSource.getRepository(LoyaltyUserEntity);
  }

  async claimReward(userId: string, rewardItemId: string) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const rewardItem = await transactionalEntityManager
          .getRepository(RewardItemEntity)
          .findOne({
            where: { id: rewardItemId },
            relations: ['source', 'min_tier'],
          });

        if (!rewardItem) throw new NotFoundException('Reward item not found');
        if (rewardItem.stock === 0) {
          throw new BadRequestException('Reward item is out of stock');
        }

        const user = await transactionalEntityManager
          .getRepository(LoyaltyUserEntity)
          .findOne({
            where: { core_user_id: userId },
            relations: ['tier'],
          });
        if (!user) {
          throw new BadRequestException('User has no loyalty profile');
        }

        // Exclusive window semantics: min_tier gates only DURING the window
        // (exclusive to that tier), then the reward opens to everyone.
        const created = new Date(rewardItem.created_at || Date.now());
        const exclusiveUntil = new Date(
          created.getTime() + rewardItem.exclusive_days * 24 * 60 * 60 * 1000,
        );
        const inWindow =
          rewardItem.exclusive_days > 0 && new Date() < exclusiveUntil;

        if (
          rewardItem.min_tier &&
          inWindow &&
          (!user.tier || user.tier.level < rewardItem.min_tier.level)
        ) {
          throw new ForbiddenException(
            `This reward is exclusive to tier ${rewardItem.min_tier.name} for now`,
          );
        }

        if (
          Number(rewardItem.point_price) > 0 &&
          Number(user.balance_points) < Number(rewardItem.point_price)
        ) {
          throw new BadRequestException('Insufficient points');
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

        if (Number(rewardItem.point_price) > 0) {
          await this.pointService.spend(
            user,
            Number(rewardItem.point_price),
            'REWARD_CLAIM',
            rewardItem.id,
            transactionalEntityManager,
          );
        }

        return claimResult;
      },
    );
  }

  findAllRewards() {
    return this.rewardItemRepo.find({
      relations: ['source', 'min_tier'],
    });
  }
}
