import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { Request } from 'express';

@Controller('/loyalty/points')
export class PointsController {
  constructor(
    @Inject('POINTS_SERVICE') private readonly pointsService: PointsService,
  ) {}

  @Get('profile')
  @UseGuards(ConsumerJwtGuard)
  getProfile(@Req() req: Request) {
    return this.pointsService.getProfile(req.user['userId']);
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
