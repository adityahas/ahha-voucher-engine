import { Controller, Get } from '@nestjs/common';
import { LoyaltyConsumerService } from './loyalty-consumer.service';

@Controller('/loyalty')
export class LoyaltyConsumerController {
  constructor(
    private readonly loyaltyConsumerService: LoyaltyConsumerService,
  ) {}

  @Get()
  getHello(): string {
    return this.loyaltyConsumerService.getHello();
  }
}
