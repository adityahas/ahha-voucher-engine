import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RewardItemService } from './reward-item.service';
import { CreateRewardItemDto } from './dto/create-reward-item.dto';
import { UpdateRewardItemDto } from './dto/update-reward-item.dto';

@Controller('loyalty-admin/reward-item')
export class RewardItemController {
  constructor(private readonly rewardItemService: RewardItemService) {}

  @Post()
  create(@Body() createRewardItemDto: CreateRewardItemDto) {
    return this.rewardItemService.create(createRewardItemDto);
  }

  @Get()
  findAll() {
    return this.rewardItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardItemService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRewardItemDto: UpdateRewardItemDto,
  ) {
    return this.rewardItemService.update(id, updateRewardItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rewardItemService.remove(+id);
  }
}
