import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UseAdminJwtGuard } from '../../auth/auth.decorator';

@Controller('users')
export class UserController {
  constructor(
    @Inject('USER_SERVICE')
    private readonly userService: UserService,
  ) {}

  @Get()
  @UseAdminJwtGuard()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseAdminJwtGuard()
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @UseAdminJwtGuard()
  create(@Body() user: CreateUserDto) {
    return this.userService.create(user);
  }

  @Put(':id')
  @UseAdminJwtGuard()
  update(@Param('id') id: string, @Body() user: CreateUserDto) {
    return this.userService.update(id, user);
  }
}
