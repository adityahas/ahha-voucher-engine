import { DataSource } from 'typeorm';
import { Admin } from '../admin/entities/admin.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmins(dataSource: DataSource) {
  const adminRepo = dataSource.getRepository(Admin);

  const existing = await adminRepo.findOneBy({ email: 'admin@example.com' });
  if (existing) {
    console.log('Admin already seeded');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = adminRepo.create({
    name: 'Super Admin',
    email: 'admin@example.com',
    password: hashedPassword,
    client: { database_name: 'default_db' }, // sesuaikan dengan client yang ada
  });

  await adminRepo.save(admin);
  console.log('Admin seeded');
}