import { Body, Controller, Inject, Post, Req } from '@nestjs/common';
import { UserConsumerService } from './user-consumer.service';
import { LoginUserDto } from './dto/login-user.dto';
import { BaseController } from '@core/base/base.controller';

@Controller('/user')
export class UserConsumerController extends BaseController {
  constructor(
    @Inject('USER_CONSUMER_SERVICE')
    private readonly userService: UserConsumerService,
  ) {
    super();
  }

  @Post('/login')
  login(@Req() req: Request, @Body() loginUserDto: LoginUserDto) {
    console.log(__dirname);
    return this.userService.login(loginUserDto);
  }
}
