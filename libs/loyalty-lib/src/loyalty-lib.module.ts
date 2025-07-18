import { Module } from '@nestjs/common';
import { LoyaltyLibService } from './loyalty-lib.service';

@Module({
  providers: [LoyaltyLibService],
  exports: [LoyaltyLibService],
})
export class LoyaltyLibModule {}
