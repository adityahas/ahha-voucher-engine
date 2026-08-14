import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserPointsService } from './user-points.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AssignTierDto } from './dto/assign-tier.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller('/loyalty-admin/users')
@UseGuards(AdminJwtGuard, AclGuard)
export class UserPointsController {
  constructor(
    @Inject('USER_POINTS_SERVICE')
    private readonly userPointsService: UserPointsService,
  ) {}

  @Get(':coreUserId/points')
  @Permissions('manage:points')
  getProfile(@Param('coreUserId') coreUserId: string) {
    return this.userPointsService.getProfile(coreUserId);
  }

  @Get(':coreUserId/points/history')
  @Permissions('manage:points')
  getHistory(
    @Param('coreUserId') coreUserId: string,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    return this.userPointsService.getLedger(
      coreUserId,
      Number(page),
      Number(size),
    );
  }

  @Post(':coreUserId/points/adjust')
  @Permissions('manage:points')
  adjust(
    @Param('coreUserId') coreUserId: string,
    @Body() dto: AdjustPointsDto,
  ) {
    return this.userPointsService.adjustPoints(
      coreUserId,
      dto.delta,
      dto.reason,
    );
  }

  @Post(':coreUserId/tier')
  @Permissions('manage:points')
  assignTier(
    @Param('coreUserId') coreUserId: string,
    @Body() dto: AssignTierDto,
  ) {
    return this.userPointsService.assignTier(coreUserId, dto.tier_id);
  }
}
