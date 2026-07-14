import { Module, forwardRef, Scope } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RetailerService } from './retailer.service';
import { RetailerController } from './retailer.controller';
import { RedistroModule } from '../redistro.module';

@Module({
  imports: [forwardRef(() => RedistroModule)],
  providers: [
    {
      provide: RetailerService,
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new RetailerService(dataSource);
      },
      inject: ['REDISTRO_CONNECTION'],
    },
  ],
  controllers: [RetailerController],
  exports: [RetailerService],
})
export class RetailerModule {}
