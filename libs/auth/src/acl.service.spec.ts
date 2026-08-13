import { AclService } from './acl.service';
import { Role } from './roles.enum';

describe('AclService loyalty permissions', () => {
  it('grants admin manage:tiers and manage:points', () => {
    const service = new AclService();
    expect(service.can(Role.ADMIN, 'manage:tiers')).toBe(true);
    expect(service.can(Role.ADMIN, 'manage:points')).toBe(true);
  });
});
