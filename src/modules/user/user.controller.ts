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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AclGuard } from '../../acl/acl.guard';
import { Permissions } from '../../acl/permissions.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(
    @Inject('USER_SERVICE')
    private readonly userService: UserService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), AclGuard)
  @Permissions('read:users')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), AclGuard)
  @Permissions('read:users')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), AclGuard)
  @Permissions('write:users')
  create(@Body() user: CreateUserDto) {
    return this.userService.create(user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), AclGuard)
  @Permissions('write:users')
  update(@Param('id') id: string, @Body() user: CreateUserDto) {
    return this.userService.update(id, user);
  }
}
