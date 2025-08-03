import { forwardRef, Module, Scope } from '@nestjs/common';
import { VoucherLaService } from './voucher-la.service';
import { VoucherLaController } from './voucher-la.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from '@core/database/entities/client.entity';
import { AuthModule } from '@core/auth';
import { DataSource } from 'typeorm';
import { LoyaltyAdminModule } from '../loyalty-admin.module';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { VoucherBindingEntity } from '@core/loyalty/voucher/entities/voucher-binding.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { VoucherUsageEntity } from '@core/loyalty/voucher/entities/voucher-usage.entity';
import { VoucherValidityEntity } from '@core/loyalty/voucher/entities/voucher-validity.entity';

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
    forwardRef(() => LoyaltyAdminModule),
  ],
  providers: [
    {
      provide: 'VOUCHER_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new VoucherLaService(dataSource);
      },
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
  controllers: [VoucherLaController],
  exports: [],
})
export class VoucherLaModule {}
