import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { clientsSeeder } from './clients.seeder';
import { AdminEntity } from '../entities/admin.entity';
import { Role } from '@core/auth/roles.enum';

export async function seedAdmins(dataSource: DataSource) {
  await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      email VARCHAR UNIQUE NOT NULL,
      password VARCHAR NOT NULL,
      role VARCHAR NOT NULL DEFAULT 'admin',
      client_database_name VARCHAR REFERENCES clients(database_name),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      deleted_at TIMESTAMPTZ
    );
  `);

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
      role: Role.ADMIN,
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
  role: Role.ADMIN,
}));
