import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Module({
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
