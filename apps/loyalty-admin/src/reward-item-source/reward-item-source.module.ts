import { Module, forwardRef, Scope } from '@nestjs/common';
import { RewardItemSourceService } from './reward-item-source.service';
import { RewardItemSourceController } from './reward-item-source.controller';
import { DataSource } from 'typeorm';
import { LoyaltyAdminModule } from '../loyalty-admin.module';

@Module({
  imports: [forwardRef(() => LoyaltyAdminModule)],
  controllers: [RewardItemSourceController],
  providers: [
    {
      provide: RewardItemSourceService,
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new RewardItemSourceService(dataSource);
      },
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
  exports: [RewardItemSourceService],
})
export class RewardItemSourceModule {}
