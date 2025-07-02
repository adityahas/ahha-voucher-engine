import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:profile')
  getHello(): string {
    return this.appService.getHello();
  }
}
