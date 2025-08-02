import { Module } from '@nestjs/common';
import { RewardItemSourceService } from './reward-item-source.service';
import { RewardItemSourceController } from './reward-item-source.controller';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([RewardItemSourceEntity])],
  controllers: [RewardItemSourceController],
  providers: [RewardItemSourceService],
  exports: [RewardItemSourceService],
})
export class RewardItemSourceModule {}
