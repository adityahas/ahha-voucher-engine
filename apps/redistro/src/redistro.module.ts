import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedistroService } from './redistro.service';
import { RedistroController } from './redistro.controller';
import { RetailerModule } from './retailer/retailer.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { UserAdminModule } from '../../user-admin/src/user-admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // InventoryStock,
      // SalesOrder,
      // SalesOrderItem,
      // Delivery,
      // SalesVisit,
    ]),
    RetailerModule,
    WarehouseModule,
    UserAdminModule,
  ],
  providers: [RedistroService],
  controllers: [RedistroController],
  exports: [RedistroService],
})
export class RedistroModule {}
