import { Module, forwardRef, Scope } from '@nestjs/common';
import { RewardItemService } from './reward-item.service';
import { RewardItemController } from './reward-item.controller';
import { DataSource } from 'typeorm';
import { LoyaltyAdminModule } from '../loyalty-admin.module';

@Module({
  imports: [forwardRef(() => LoyaltyAdminModule)],
  controllers: [RewardItemController],
  providers: [
    {
      provide: RewardItemService,
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new RewardItemService(dataSource);
      },
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
  exports: [RewardItemService],
})
export class RewardItemModule {}
