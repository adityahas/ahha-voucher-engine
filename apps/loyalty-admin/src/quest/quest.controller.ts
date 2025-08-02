import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('quest')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Post()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:quests')
  create(@Body() createQuestDto: CreateQuestDto) {
    return this.questService.create(createQuestDto);
  }

  @Get()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:quests')
  findAll() {
    return this.questService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:quests')
  findOne(@Param('id') id: string) {
    return this.questService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:quests')
  update(@Param('id') id: string, @Body() updateQuestDto: UpdateQuestDto) {
    return this.questService.update(+id, updateQuestDto);
  }

  @Delete(':id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:quests')
  remove(@Param('id') id: string) {
    return this.questService.remove(+id);
  }
}
