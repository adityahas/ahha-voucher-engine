import { Module } from '@nestjs/common';
import { RewardItemService } from './reward-item.service';
import { RewardItemController } from './reward-item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RewardItemEntity])],
  controllers: [RewardItemController],
  providers: [RewardItemService],
  exports: [RewardItemService],
})
export class RewardItemModule {}
