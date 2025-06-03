import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
import { BaseController } from '../../base/base.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.userService.findAll(this.getDatabaseName(req));
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.userService.findOne(this.getDatabaseName(req), id);
  }

  @Post()
  create(@Req() req: Request, @Body() user: CreateUserDto) {
    return this.userService.create(this.getDatabaseName(req), user);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() user: CreateUserDto,
  ) {
    return this.userService.update(this.getDatabaseName(req), id, user);
  }
}
