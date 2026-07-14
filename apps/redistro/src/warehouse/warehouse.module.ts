import { Module, forwardRef, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { RedistroModule } from '../redistro.module';

@Module({
  imports: [forwardRef(() => RedistroModule)],
  providers: [
    {
      provide: WarehouseService,
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new WarehouseService(dataSource);
      },
      inject: ['REDISTRO_CONNECTION'],
    },
  ],
  controllers: [WarehouseController],
  exports: [WarehouseService],
})
export class WarehouseModule {}
