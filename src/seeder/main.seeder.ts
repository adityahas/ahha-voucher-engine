import 'dotenv/config';
import { DataSource } from 'typeorm';
import { seedAdmins } from './admins.seeder';
import { Admin } from '../admin/entities/admin.entity';
import { Client } from '../client/entities/client.entity';
import { seedClients } from './clients.seeder';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Admin, Client],
  synchronize: false,
});

dataSource
  .initialize()
  .then(async () => {
    console.log('Database connected');
    await seedClients(dataSource);
    await seedAdmins(dataSource);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeder error', err);
    process.exit(1);
  });
