import { forwardRef, Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestController } from './quest.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestEntity } from './entities/quest.entity';
import { AuthModule } from '@core/auth';

@Module({
  imports: [TypeOrmModule.forFeature([QuestEntity]), forwardRef(() => AuthModule)],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
