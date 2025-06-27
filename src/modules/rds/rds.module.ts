import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RdsService } from './rds.service';
import { RdsController } from './rds.controller';
import { ProductModule } from '../product/product.module';
import { RetailerModule } from './retailer/retailer.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // InventoryStock,
      // SalesOrder,
      // SalesOrderItem,
      // Delivery,
      // SalesVisit,
    ]),
    ProductModule,
    RetailerModule,
    WarehouseModule,
    UserModule,
  ],
  providers: [RdsService],
  controllers: [RdsController],
  exports: [RdsService],
})
export class RdsModule {}
