import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RewardItemService } from './reward-item.service';
import { CreateRewardItemDto } from './dto/create-reward-item.dto';
import { UpdateRewardItemDto } from './dto/update-reward-item.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

@Controller('loyalty-admin/reward-item')
export class RewardItemController {
  constructor(private readonly rewardItemService: RewardItemService) {}

  @Post()
  create(@Body() createRewardItemDto: CreateRewardItemDto) {
    return this.rewardItemService.create(createRewardItemDto);
  }

  @Get()
  findAll(@Query() paginationDto: BasePaginationDto) {
    return this.rewardItemService.findAll(paginationDto);
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
