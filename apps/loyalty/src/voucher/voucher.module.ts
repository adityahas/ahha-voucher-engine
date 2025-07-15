import { forwardRef, Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherEntity } from './entities/voucher.entity';
import { VoucherBindingEntity } from './entities/voucher-binding.entity';
import { VoucherCategoryEntity } from './entities/voucher-category.entity';
import { VoucherClaimEntity } from './entities/voucher-claim.entity';
import { VoucherUsageEntity } from './entities/voucher-usage.entity';
import { VoucherValidityEntity } from './entities/voucher-validity.entity';
import { Client } from '@core/database/entities/client.entity';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      VoucherEntity,
      VoucherBindingEntity,
      VoucherCategoryEntity,
      VoucherClaimEntity,
      VoucherUsageEntity,
      VoucherValidityEntity,
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
