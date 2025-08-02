import { Controller, Get, Inject } from '@nestjs/common';

@Controller('/loyalty-admin')
export class LoyaltyAdminController {
  constructor(@Inject('LOYALTY_CONNECTION') private readonly connection: any) {
    console.log(connection);
  }

  @Get()
  findAll() {
    return 'This action returns all loyalty items';
  }
}
