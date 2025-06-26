import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AclGuard } from './acl/acl.guard';
import { Permissions } from './acl/permissions.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), AclGuard)
  @Permissions('read:profile')
  getHello(): string {
    return this.appService.getHello();
  }
}
