import { Module, forwardRef, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { PurchaseController } from './purchase.controller';
import { TierService } from '@core/loyalty/tier/tier.service';
import { PointService } from '@core/loyalty/point/point.service';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { ClientSettingsEntity } from '@core/database/entities/client-settings.entity';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyConsumerModule),
    TypeOrmModule.forFeature([ClientSettingsEntity]),
  ],
  controllers: [VoucherController, PurchaseController],
  providers: [
    TierService,
    PointService,
    ClientSettingsService,
    {
      provide: 'VOUCHER_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new VoucherService(dataSource);
      },
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
  ],
})
export class VoucherModule {}
