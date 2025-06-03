import { DataSource } from 'typeorm';
import { Admin } from '../admin/entities/admin.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmins(dataSource: DataSource) {
  const adminRepo = dataSource.getRepository(Admin);

  for (const adminData of adminsSeeder) {
    const exists = await adminRepo.findOneBy({
      email: adminData.email,
    });
    if (exists) {
      console.log(`Admin ${adminData.email} already seeded`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = adminRepo.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      client: { database_name: adminData.client.database_name },
    });

    await adminRepo.save(admin);
    console.log(`Admin ${adminData.email} seeded`);
  }
  console.log('Admins seeded');
}

export const adminsSeeder = [
  {
    name: 'Client 1 Admin',
    email: 'admin@client1.com',
    password: 'admin123',
    client: { database_name: 'ahha_client_1_db' },
  },
  {
    name: 'Client 2 Admin',
    email: 'admin@client2.com',
    password: 'admin123',
    client: { database_name: 'ahha_client_2_db' },
  },
];
