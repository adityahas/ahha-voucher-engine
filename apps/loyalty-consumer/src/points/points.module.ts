import { forwardRef, Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { DataSource } from 'typeorm';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { ClientSettingsEntity } from '@core/database/entities/client-settings.entity';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';

@Module({
  imports: [
    forwardRef(() => LoyaltyConsumerModule),
    TypeOrmModule.forFeature([ClientSettingsEntity]),
  ],
  controllers: [PointsController],
  providers: [
    ClientSettingsService,
    {
      provide: 'POINTS_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new PointsService(dataSource),
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
  ],
})
export class PointsModule {}
