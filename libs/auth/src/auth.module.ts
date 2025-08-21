import { Module } from '@nestjs/common';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { AclService } from '@core/auth/acl.service';
import { AclGuard } from '@core/auth/guards/acl.guard';

@Module({
  providers: [AdminJwtGuard, AclService, AclGuard],
  exports: [AdminJwtGuard, AclService, AclGuard],
})
export class AuthModule {}
