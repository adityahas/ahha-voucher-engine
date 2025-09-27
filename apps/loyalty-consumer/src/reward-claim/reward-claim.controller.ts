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
import { RewardClaimService } from './reward-claim.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';

@Controller('rewards')
export class RewardClaimController extends BaseController {
  constructor(
    @Inject('REWARD_CLAIM_SERVICE')
    private readonly rewardClaimService: RewardClaimService, // Replace 'any' with the actual service type
  ) {
    super();
  }

  @Get()
  @UseGuards(ConsumerJwtGuard)
  findAllRewards() {
    return this.rewardClaimService.findAllRewards();
  }

  @Post('/claim/:reward_id')
  @UseGuards(ConsumerJwtGuard)
  claimReward(@Param('reward_id') rewardId: string, @Req() req: Request) {
    const userId = req.user['userId'];
    return this.rewardClaimService.claimReward(userId, rewardId);
  }
}
