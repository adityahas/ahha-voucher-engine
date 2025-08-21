import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@core/auth/decorators/permissions.decorator';
import { AclService } from '@core/auth/acl.service';
import { Role } from '@core/auth/roles.enum';

@Injectable()
export class AclGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private aclService: AclService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // Assuming user has a 'role' property. Adjust as needed.
    const userRole = user?.role as Role;
    if (!userRole) {
      return false;
    }

    return requiredPermissions.every((permission) =>
      this.aclService.can(userRole, permission),
    );
  }
}
