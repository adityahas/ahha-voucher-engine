import { forwardRef, Module, Scope } from '@nestjs/common';
import { UserPointsController } from './user-points.controller';
import { UserPointsService } from './user-points.service';
import { PointService } from '@core/loyalty/point/point.service';
import { DataSource } from 'typeorm';
import { AuthModule } from '@core/auth';
import { LoyaltyAdminModule } from '../loyalty-admin.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => LoyaltyAdminModule)],
  controllers: [UserPointsController],
  providers: [
    PointService,
    {
      provide: 'USER_POINTS_SERVICE',
      scope: Scope.REQUEST,
      useFactory: (dataSource: DataSource) =>
        new UserPointsService(dataSource, new PointService()),
      inject: ['LOYALTY_CONNECTION'],
    },
  ],
})
export class UserPointsModule {}
