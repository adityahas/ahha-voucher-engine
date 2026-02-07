import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy-factory.service';
import { GoPayRewardStrategy } from './strategy/gopay-reward.strategy';

@Module({
  controllers: [RewardController],
  providers: [
    RewardService,
    RewardClaimStrategyFactory,
    GoPayRewardStrategy,
    {
      provide: 'REWARD_SERVICE',
      useClass: RewardService,
    },
  ],
})
export class RewardModule {}
