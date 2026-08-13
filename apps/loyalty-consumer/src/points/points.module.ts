import { Module, Scope, forwardRef } from '@nestjs/common';
import { PointsController } from './points.controller';
import { PointsService } from './points.service';
import { DataSource } from 'typeorm';
import { LoyaltyConsumerModule } from '../loyalty-consumer.module';

@Module({
  imports: [forwardRef(() => LoyaltyConsumerModule)],
  controllers: [PointsController],
  providers: [
    {
      provide: 'POINTS_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) => new PointsService(dataSource),
      inject: ['LOYALTY_CONSUMER_CONNECTION'],
    },
  ],
})
export class PointsModule {}
