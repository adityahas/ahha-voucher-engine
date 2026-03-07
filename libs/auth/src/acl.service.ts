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
      'read:vouchers',
      'write:vouchers',
      'read:quests',
      'write:quests',
      'read:voucher-categories',
      'write:voucher-categories',
    ],
    [Role.SALES]: ['read:products', 'read:warehouses'],
    [Role.DRIVER]: ['read:orders', 'write:orders'],
  };

  can(role: Role, permission: string): boolean {
    return this.acl[role]?.includes(permission) || false;
  }
}
