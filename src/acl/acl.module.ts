import { Module } from '@nestjs/common';
import { AclService } from './acl.service';

@Module({
  providers: [AclService],
  exports: [AclService],
})
export class AclModule {}
