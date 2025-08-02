import { Body, Controller, Get, Inject, Post, Req } from '@nestjs/common';
import { AuthConsumerService } from './auth-consumer.service';
import { BaseController } from '@core/base/base.controller';
import { LoginAdminDto } from '../../admin/src/dto/login-admin.dto';

@Controller()
export class AuthConsumerController extends BaseController {
  constructor(
    @Inject('AUTH_CONSUMER_SERVICE')
    private readonly authConsumerService: AuthConsumerService,
  ) {
    super();
  }

  @Post('/user/login')
  login(@Req() req: Request, @Body() loginAdminDto: LoginAdminDto) {
    console.log(__dirname);
    return this.authConsumerService.login(
      this.getDatabaseName(req),
      loginAdminDto,
    );
  }

  @Get()
  getHello(): string {
    return this.authConsumerService.getHello();
  }
}
