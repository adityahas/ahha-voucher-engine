import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { Request } from 'express';

@Controller('/loyalty/points')
export class PointsController {
  constructor(
    @Inject('POINTS_SERVICE') private readonly pointsService: PointsService,
    private readonly settingsService: ClientSettingsService,
  ) {}

  @Get('profile')
  @UseGuards(ConsumerJwtGuard)
  async getProfile(@Req() req: Request) {
    const profile = await this.pointsService.getProfile(req.user['userId']);
    const settings = await this.settingsService.getLoyaltySettings(
      req['client'].database_name,
    );
    return {
      ...profile,
      point_to_currency_rate: Number(settings.point_to_currency_rate),
    };
  }

  @Get('history')
  @UseGuards(ConsumerJwtGuard)
  getHistory(
    @Req() req: Request,
    @Query('page') page = 0,
    @Query('size') size = 10,
  ) {
    return this.pointsService.getHistory(
      req.user['userId'],
      Number(page),
      Number(size),
    );
  }
}
