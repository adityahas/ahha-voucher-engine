import { forwardRef, Module, Scope } from '@nestjs/common';
import { VoucherLcService } from './voucher-lc.service';
import { VoucherLcController } from './voucher-lc.controller';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyConsumerModule),
  ],
  controllers: [VoucherLcController],
  providers: [
    {
      provide: 'VOUCHER_LC_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new VoucherLcService(dataSource);
      },
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
  ],
})
export class VoucherLcModule {}
