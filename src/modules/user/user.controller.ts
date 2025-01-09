import { Controller, Get, Post } from '@nestjs/common';

@Controller('api/users')
export class UserController {
  @Post()
  post() {
    return 'This action adds a new user';
  }

  @Get()
  get() {
    return 'This action returns all users';
  }
}
