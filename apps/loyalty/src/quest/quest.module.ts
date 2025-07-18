import { forwardRef, Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestController } from './quest.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@core/auth';
import { QuestEntity } from '@core/loyalty-lib/quest/entities/quest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [QuestController],
  providers: [QuestService],
})
export class QuestModule {}
