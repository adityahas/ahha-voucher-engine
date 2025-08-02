import { forwardRef, Module, Scope } from '@nestjs/common';
import { RewardClaimService } from './reward-claim.service';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy.factory';
import { GoPayRewardStrategy } from './strategy/gopay-reward.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';

@Module({
  imports: [
    forwardRef(() => LoyaltyConsumerModule),
    TypeOrmModule.forFeature([RewardItemEntity]),
  ],
  providers: [
    RewardClaimStrategyFactory,
    GoPayRewardStrategy,
    {
      provide: 'REWARD_CLAIM_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (
        connection: DataSource,
        rewardClaimStrategyFactory: RewardClaimStrategyFactory,
      ) => {
        return new RewardClaimService(connection, rewardClaimStrategyFactory);
      },
      inject: ['LOYALTY_CONSUMER_CONNECTION', RewardClaimStrategyFactory],
    },
  ],
  exports: [],
})
export class RewardClaimModule {}
