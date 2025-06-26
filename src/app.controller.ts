import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AclGuard } from './acl/acl.guard';
import { Permissions } from './acl/permissions.decorator';
import { AdminJwtGuard } from './auth/admin-jwt.guard';

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
