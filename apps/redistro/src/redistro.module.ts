import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedistroService } from './redistro.service';
import { RedistroController } from './redistro.controller';
import { RetailerModule } from './retailer/retailer.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { UserAdminModule } from '../../user-admin/src/user-admin.module';
import { InventoryStock } from './entities/inventory-stock.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { Delivery } from './entities/delivery.entity';
import { SalesVisit } from './entities/sales-visit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryStock,
      SalesOrder,
      SalesOrderItem,
      Delivery,
      SalesVisit,
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
