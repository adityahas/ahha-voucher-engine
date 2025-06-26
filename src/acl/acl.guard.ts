import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AclService } from './acl.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { Role } from './roles.enum';

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
    console.log(userRole);
    if (!userRole) {
      return false;
    }

    return requiredPermissions.every((permission) =>
      this.aclService.can(userRole, permission),
    );
  }
}
