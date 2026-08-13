import { Module, Scope, forwardRef } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy-factory.service';
import { GoPayRewardStrategy } from './strategy/gopay-reward.strategy';
import { PointService } from '@core/loyalty/point/point.service';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyConsumerModule),
  ],
  controllers: [RewardController],
  providers: [
    PointService,
    RewardClaimStrategyFactory,
    GoPayRewardStrategy,
    {
      provide: 'REWARD_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (
        dataSource: DataSource,
        strategyFactory: RewardClaimStrategyFactory,
        pointService: PointService,
      ) => new RewardService(dataSource, strategyFactory, pointService),
      inject: [
        'LOYALTY_CONSUMER_CONNECTION',
        RewardClaimStrategyFactory,
        PointService,
      ],
    },
  ],
})
export class RewardModule {}
