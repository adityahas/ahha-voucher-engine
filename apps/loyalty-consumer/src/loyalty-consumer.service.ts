import { Injectable } from '@nestjs/common';

@Injectable()
export class LoyaltyConsumerService {
  getHello(): string {
    return 'Hello World!';
  }
}
