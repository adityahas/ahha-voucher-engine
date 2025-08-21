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
import { RewardItemSourceService } from './reward-item-source.service';
import { CreateRewardItemSourceDto } from './dto/create-reward-item-source.dto';
import { UpdateRewardItemSourceDto } from './dto/update-reward-item-source.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

@Controller('/loyalty-admin/reward-item-source')
export class RewardItemSourceController {
  constructor(
    private readonly rewardItemSourceService: RewardItemSourceService,
  ) {}

  @Post()
  create(@Body() createRewardItemSourceDto: CreateRewardItemSourceDto) {
    return this.rewardItemSourceService.create(createRewardItemSourceDto);
  }

  @Get()
  findAll(@Query() paginationDto: BasePaginationDto) {
    return this.rewardItemSourceService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardItemSourceService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRewardItemSourceDto: UpdateRewardItemSourceDto,
  ) {
    return this.rewardItemSourceService.update(id, updateRewardItemSourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rewardItemSourceService.remove(+id);
  }
}
