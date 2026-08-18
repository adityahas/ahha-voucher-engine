import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedAdmins } from './admins.seeder';
import { seedClients } from './clients.seeder';
import { seedTenantUsers } from './users.seeder';
import { seedTenantData } from './tenant-data.seeder';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ClientEntity } from '@core/database/entities/client.entity';
import { AdminEntity } from '../entities/admin.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  namingStrategy: new SnakeNamingStrategy(),
  database: process.env.DB_NAME,
  entities: [AdminEntity, ClientEntity],
  synchronize: false,
});

dataSource
  .initialize()
  .then(async () => {
    console.log('Database connected');
    await seedClients(dataSource);
    await seedAdmins(dataSource);
    await seedTenantUsers();
    await seedTenantData();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeder error', err);
    process.exit(1);
  });
