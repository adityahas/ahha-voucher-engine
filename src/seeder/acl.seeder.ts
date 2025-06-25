import { DataSource } from 'typeorm';
import { Permission } from '../acl/permission.entity';
import { Role } from '../acl/role.entity';
import { User } from '../user/entities/user.entity';

export const TENANT_ADMIN_ROLE_ID = '13c43edc-ae1e-47e1-a55d-ec3c8aaf6208';
export const MARKETING_ADMIN_ROLE_ID = 'c94ee4e2-f6cd-4bd1-b16b-7f792eac4346';

export const seedACL = async (dataSource: DataSource) => {
  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  dataSource.getRepository(User);

  const permissions = await permissionRepo.save([
    { name: 'voucher.read', description: 'Read vouchers' },
    { name: 'voucher.create', description: 'Create vouchers' },
    { name: 'quest.read', description: 'Read quests' },
    { name: 'quest.create', description: 'Create quests' },
    { name: 'user.manage', description: 'Manage users' },
  ]);

  const tenantAdmin = roleRepo.create({
    id: TENANT_ADMIN_ROLE_ID,
    name: 'Tenant Admin',
    permissions: permissions,
  });

  const marketingAdmin = roleRepo.create({
    id: MARKETING_ADMIN_ROLE_ID,
    name: 'Marketing Admin',
    permissions: permissions.filter((item) =>
      ['voucher.read', 'voucher.create'].includes(item.name),
    ),
  });

  await roleRepo.save([tenantAdmin, marketingAdmin]);

  console.log('ACL seeded');
};
