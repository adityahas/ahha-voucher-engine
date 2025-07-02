import { forwardRef, Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { VoucherBinding } from './entities/voucher-binding.entity';
import { VoucherCategory } from './entities/voucher-category.entity';
import { VoucherClaim } from './entities/voucher-claim.entity';
import { VoucherUsage } from './entities/voucher-usage.entity';
import { VoucherValidity } from './entities/voucher-validity.entity';
import { Client } from '@core/database/entities/client.entity';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Voucher,
      VoucherBinding,
      VoucherCategory,
      VoucherClaim,
      VoucherUsage,
      VoucherValidity,
    ]),
    forwardRef(() => AuthModule),
  ],
  providers: [
    {
      provide: 'VOUCHER_SERVICE',
      useFactory: async (connection) => {
        return new VoucherService(connection);
      },
      inject: ['CONNECTION'],
    },
  ],
  controllers: [VoucherController],
})
export class VoucherModule {}
