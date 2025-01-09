import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestController } from './quest.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quest } from './entities/quest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quest])],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
