import { Module } from '@nestjs/common';
import { RewardClaimService } from './reward-claim.service';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy.factory';
import { GoPayRewardStrategy } from './strategy/gopay-reward.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardItemEntity } from '../reward-item/entities/reward-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RewardItemEntity])],
  providers: [
    RewardClaimService,
    RewardClaimStrategyFactory,
    GoPayRewardStrategy,
  ],
  exports: [RewardClaimService],
})
export class RewardClaimModule {}
