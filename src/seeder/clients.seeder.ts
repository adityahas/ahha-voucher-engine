import { DataSource } from 'typeorm';
import { Client } from '../client/entities/client.entity';

export async function seedClients(dataSource: DataSource) {
  const clientRepo = dataSource.getRepository(Client);

  const exists = await clientRepo.findOneBy({ subdomain: 'demo' });
  if (exists) {
    console.log('Client already seeded');
    return;
  }

  const client = clientRepo.create({
    subdomain: 'demo',
    api_key: 'dummy-api-key',
    database_name: 'default_db',
    database_username: 'postgres',
    database_password: 'P4ssw0rd!',
    database_port: '5432',
    database_host: 'localhost',
  });

  await clientRepo.save(client);
  console.log('Client seeded');
}