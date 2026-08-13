import { Module, Scope } from '@nestjs/common';
import { TierController } from './tier.controller';
import { TierAdminService } from './tier-admin.service';
import { DataSource } from 'typeorm';

@Module({
  controllers: [TierController],
  providers: [
    {
      provide: 'TIER_ADMIN_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new TierAdminService(dataSource),
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
})
export class TierModule {}
