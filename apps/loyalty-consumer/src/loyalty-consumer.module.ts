import { Module } from '@nestjs/common';
import { LoyaltyConsumerController } from './loyalty-consumer.controller';
import { LoyaltyConsumerService } from './loyalty-consumer.service';

@Module({
  imports: [],
  controllers: [LoyaltyConsumerController],
  providers: [LoyaltyConsumerService],
})
export class LoyaltyConsumerModule {}
