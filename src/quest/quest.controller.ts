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
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QuestService } from './quest.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('quest')
@ApiBearerAuth()
@Controller('quest')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Post()
  create(@Body() createQuestDto: CreateQuestDto) {
    return this.questService.create(createQuestDto);
  }

  @Permissions('quest.read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List quest' })
  @Get()
  findAll() {
    return this.questService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuestDto: UpdateQuestDto) {
    return this.questService.update(+id, updateQuestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questService.remove(+id);
  }
}
