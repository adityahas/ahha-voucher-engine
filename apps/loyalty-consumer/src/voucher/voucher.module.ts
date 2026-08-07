import { Module, forwardRef, Scope } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { PurchaseController } from './purchase.controller';
import { OrderService } from '@core/product/order.service';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyConsumerModule),
  ],
  controllers: [VoucherController, PurchaseController],
  providers: [
    {
      provide: OrderService,
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new OrderService(dataSource),
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
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
