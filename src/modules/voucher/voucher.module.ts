import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { VoucherBinding } from './entities/voucher-binding.entity';
import { VoucherCategory } from './entities/voucher-category.entity';
import { VoucherClaim } from './entities/voucher-claim.entity';
import { VoucherUsage } from './entities/voucher-usage.entity';
import { VoucherValidity } from './entities/voucher-validity.entity';
import { ClientsService } from '../../client/client.service';
import { Client } from '../../client/entities/client.entity';

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
  ],
  providers: [VoucherService, ClientsService],
  controllers: [VoucherController],
})
export class VoucherModule {}
