import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '@core/user/entities/user.entity';
import { Role } from '@core/auth/roles.enum';
import { clientsSeeder } from './clients.seeder';

export async function seedTenantUsers() {
  for (const clientData of clientsSeeder) {
    const tenantDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'P4ssw0rd!',
      database: clientData.database_name,
      entities: [UserEntity],
      synchronize: true,
    });

    try {
      await tenantDataSource.initialize();
      const userRepo = tenantDataSource.getRepository(UserEntity);

      const email = `user@${clientData.subdomain}.com`;
      const exists = await userRepo.findOneBy({ email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash('user123', 10);
        const user = userRepo.create({
          name: `Consumer User ${clientData.subdomain}`,
          email,
          password: hashedPassword,
          phone: '081234567890',
          role: Role.USER,
          is_active: true,
          is_deleted: false,
        });
        await userRepo.save(user);
        console.log(
          `Consumer user ${email} seeded in ${clientData.database_name}`,
        );
      } else {
        console.log(
          `Consumer user ${email} already seeded in ${clientData.database_name}`,
        );
      }
      await tenantDataSource.destroy();
    } catch (err) {
      console.error(
        `Failed to seed tenant users for ${clientData.database_name}`,
        err,
      );
    }
  }
}
