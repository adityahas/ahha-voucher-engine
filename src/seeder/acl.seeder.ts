import { DataSource } from 'typeorm';
import { Permission } from '../acl/permission.entity';
import { Role } from '../acl/role.entity';
import { User } from '../user/entities/user.entity';

export const seedACL = async (dataSource: DataSource) => {
  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  const permissions = await permissionRepo.save([
    { name: 'voucher.read' },
    { name: 'voucher.create' },
    { name: 'quest.read' },
    { name: 'quest.create' },
    { name: 'user.manage' },
  ]);

  const tenantAdmin = roleRepo.create({
    name: 'Tenant Admin',
    permissions: permissions,
  });

  const marketingAdmin = roleRepo.create({
    name: 'Marketing Admin',
    permissions: permissions.filter((p) =>
      ['voucher.read', 'voucher.create'].includes(p.name),
    ),
  });

  await roleRepo.save([tenantAdmin, marketingAdmin]);

  // Buat test user jika belum ada
  const existing = await userRepo.findOne({
    where: { email: 'admin@test.com' },
  });
  if (!existing) {
    const user = userRepo.create({
      email: 'admin@test.com',
      password: 'hashed_password_here',
      role: tenantAdmin,
    });
    await userRepo.save(user);
    console.log('✅ Test user admin@test.com created');
  }

  console.log('✅ ACL seed completed');
};
