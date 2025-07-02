import { Module } from '@nestjs/common';
import { BaseService } from './base.service';

@Module({
  providers: [BaseService],
  exports: [BaseService],
})
export class BaseModule {}
