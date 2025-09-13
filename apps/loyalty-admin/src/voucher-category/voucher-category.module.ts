import { forwardRef, Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { VoucherCategoryService } from './voucher-category.service';
import { VoucherCategoryController } from './voucher-category.controller';
import { DataSource } from 'typeorm';
import { LoyaltyAdminModule } from '../loyalty-admin.module';
import { AuthModule } from '@core/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoucherCategoryEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => LoyaltyAdminModule),
  ],
  providers: [
    {
      provide: 'VOUCHER_CATEGORY_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new VoucherCategoryService(dataSource);
      },
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
  controllers: [VoucherCategoryController],
  exports: [],
})
export class VoucherCategoryModule {}
