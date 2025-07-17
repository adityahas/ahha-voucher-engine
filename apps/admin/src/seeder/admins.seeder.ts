import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { clientsSeeder } from './clients.seeder';
import { AdminEntity } from '../entities/admin.entity';

export async function seedAdmins(dataSource: DataSource) {
  const adminRepo = dataSource.getRepository(AdminEntity);

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
}

export const adminsSeeder = clientsSeeder.map((value) => ({
  name: `Admin ${value.subdomain}`,
  email: `admin@${value.subdomain}.com`,
  password: 'admin123',
  client: { database_name: value.database_name },
}));
