import { forwardRef, Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestController } from './quest.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './entities/quest.entity';
import { AuthModule } from '@core/auth';

@Module({
  imports: [TypeOrmModule.forFeature([Quest]), forwardRef(() => AuthModule)],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
