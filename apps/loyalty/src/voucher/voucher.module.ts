import { forwardRef, Module, Scope } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '@core/database/entities/client.entity';
import { AuthModule } from '@core/auth';
import { DataSource } from 'typeorm';
import { LoyaltyModule } from '../loyalty.module';
import { VoucherEntity } from '@core/loyalty-lib/voucher/entities/voucher.entity';
import { VoucherBindingEntity } from '@core/loyalty-lib/voucher/entities/voucher-binding.entity';
import { VoucherCategoryEntity } from '@core/loyalty-lib/voucher/entities/voucher-category.entity';
import { VoucherClaimEntity } from '@core/loyalty-lib/voucher/entities/voucher-claim.entity';
import { VoucherUsageEntity } from '@core/loyalty-lib/voucher/entities/voucher-usage.entity';
import { VoucherValidityEntity } from '@core/loyalty-lib/voucher/entities/voucher-validity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientEntity,
      VoucherEntity,
      VoucherBindingEntity,
      VoucherCategoryEntity,
      VoucherClaimEntity,
      VoucherUsageEntity,
      VoucherValidityEntity,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyModule),
  ],
  providers: [
    {
      provide: 'VOUCHER_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (connection: DataSource) => {
        return new VoucherService(connection);
      },
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
  controllers: [VoucherController],
  exports: [],
})
export class VoucherModule {}
