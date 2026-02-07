import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserAdminService } from './user-admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { Permissions } from '@core/auth/decorators/permissions.decorator';
import { BaseController } from '@core/base/base.controller';

@Controller('/user-admin')
export class UserAdminController extends BaseController {
  constructor(
    @Inject('USER_ADMIN_SERVICE')
    private readonly userService: UserAdminService,
  ) {
    super();
  }

  @Get('/users')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:users')
  findAll() {
    return this.userService.findAll();
  }

  @Get('/users/:id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('read:users')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post('/users')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:users')
  create(@Body() user: CreateUserDto) {
    return this.userService.create(user);
  }

  @Put('/users/:id')
  @UseGuards(AdminJwtGuard, AclGuard)
  @Permissions('write:users')
  update(@Param('id') id: string, @Body() user: CreateUserDto) {
    return this.userService.update(id, user);
  }
}
