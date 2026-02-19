import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@core/base/base.controller';
import { RewardService } from './reward.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';

@Controller('rewards')
export class RewardController extends BaseController {
  constructor(
    @Inject('REWARD_SERVICE')
    private readonly rewardService: RewardService,
  ) {
    super();
  }

  @Get()
  @UseGuards(ConsumerJwtGuard)
  findAllRewards() {
    return this.rewardService.findAllRewards();
  }

  @Post('claim/:reward_id')
  @UseGuards(ConsumerJwtGuard)
  claimReward(@Param('reward_id') rewardId: string, @Req() req: Request) {
    const userId = req.user['userId'];
    return this.rewardService.claimReward(userId, rewardId);
  }
}
