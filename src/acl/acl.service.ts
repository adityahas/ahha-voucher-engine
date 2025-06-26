import { Injectable } from '@nestjs/common';
import { Role } from './roles.enum';

@Injectable()
export class AclService {
  private readonly acl: Record<Role, string[]> = {
    [Role.USER]: ['read:profile'],
    [Role.ADMIN]: [
      'read:profile',
      'write:profile',
      'read:users',
      'write:users',
    ],
  };

  can(role: Role, permission: string): boolean {
    return this.acl[role]?.includes(permission) || false;
  }
}
