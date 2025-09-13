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
    console.log('ACL Guard - User object:', user);
    const userRole = user?.role as Role;
    console.log('ACL Guard - User Role:', userRole);
    if (!userRole) {
      console.log('ACL Guard - User role is missing.');
      return false;
    }

    const hasPermission = requiredPermissions.every((permission) => {
      const canAccess = this.aclService.can(userRole, permission);
      console.log(
        `ACL Guard - Checking permission: ${permission} for role: ${userRole} - Result: ${canAccess}`,
      );
      return canAccess;
    });

    console.log('ACL Guard - Final permission check result:', hasPermission);
    return hasPermission;
  }
}
