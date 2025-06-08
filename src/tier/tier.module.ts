import { Module } from '@nestjs/common';

import { TierController } from './tier.controller';

@Module({
  controllers: [TierController],
})
export class TierModule {}
