import { DataSource } from 'typeorm';
import { Client } from '@core/database/entities/client.entity';
import { EncryptionService } from '@core/encryption';

export async function seedClients(dataSource: DataSource) {
  const clientRepo = dataSource.getRepository(Client);
  const encryptionService = new EncryptionService();

  for (const clientData of clientsSeeder) {
    const exists = await clientRepo.findOneBy({
      subdomain: clientData.subdomain,
    });
    if (exists) {
      console.log(`Client ${clientData.subdomain} already seeded`);
      continue;
    }

    const encryptedPassword = encryptionService.encrypt(
      clientData.database_password,
    );

    const client = clientRepo.create({
      subdomain: clientData.subdomain,
      api_key: clientData.api_key,
      database_name: clientData.database_name,
      database_username: clientData.database_username,
      database_password: encryptedPassword,
      database_port: clientData.database_port,
      database_host: clientData.database_host,
    });

    await clientRepo.save(client);
    console.log(`Clients ${clientData.subdomain} seeded`);
  }
  console.log('Client seeded');
}

export const clientsSeeder = [
  {
    subdomain: 'client1',
    api_key: 'client1-api-key',
    database_name: 'ahha_client1_db',
    database_username: 'postgres',
    database_password: 'P4ssw0rd!',
    database_port: '5432',
    database_host: 'localhost',
  },
  {
    subdomain: 'client2',
    api_key: 'client2-api-key',
    database_name: 'ahha_client2_db',
    database_username: 'postgres',
    database_password: 'P4ssw0rd!',
    database_port: '5432',
    database_host: 'localhost',
  },
];
