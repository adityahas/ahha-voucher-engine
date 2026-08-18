import { DataSource } from 'typeorm';
import { ClientEntity } from '@core/database/entities/client.entity';
import { EncryptionService } from '@core/encryption';

export async function seedClients(dataSource: DataSource) {
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS clients (
      database_name VARCHAR PRIMARY KEY,
      subdomain VARCHAR UNIQUE NOT NULL,
      api_key VARCHAR NOT NULL,
      database_username VARCHAR NOT NULL,
      database_password VARCHAR NOT NULL,
      database_port VARCHAR NOT NULL,
      database_host VARCHAR NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      deleted_at TIMESTAMPTZ
    );
  `);

  const clientRepo = dataSource.getRepository(ClientEntity);
  const encryptionService = new EncryptionService();

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS client_settings (
      client_database_name VARCHAR PRIMARY KEY REFERENCES clients(database_name) ON DELETE CASCADE,
      currency_code VARCHAR(3) NOT NULL DEFAULT 'IDR',
      locale VARCHAR(35) NOT NULL DEFAULT 'id-ID',
      number_format_options JSONB NOT NULL DEFAULT '{}'::jsonb,
      point_base_rate DECIMAL(12,2) NOT NULL DEFAULT 1000,
      max_combined_discount_percent DECIMAL(12,2) NOT NULL DEFAULT 50,
      point_to_currency_rate DECIMAL(12,4) NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    );
  `);

  for (const clientData of clientsSeeder) {
    const exists = await clientRepo.findOneBy({
      subdomain: clientData.subdomain,
    });
    if (exists) {
      console.log(`Client ${clientData.subdomain} already seeded`);
      await dataSource.query(`
        INSERT INTO client_settings (client_database_name)
        VALUES ('${clientData.database_name}')
        ON CONFLICT (client_database_name) DO NOTHING;
      `);
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
    await dataSource.query(`
      INSERT INTO client_settings (client_database_name)
      VALUES ('${clientData.database_name}')
      ON CONFLICT (client_database_name) DO NOTHING;
    `);
    console.log(`Clients ${clientData.subdomain} seeded`);
  }
  console.log('Client seeded');
}

export const clientsSeeder = [
  {
    subdomain: 'client1',
    api_key: 'client1-api-key',
    database_name: 'ahha_client1_db',
    database_username: process.env.DB_USERNAME || 'postgres',
    database_password: process.env.DB_PASSWORD || 'P4ssw0rd!',
    database_port: process.env.DB_PORT || '5432',
    database_host: process.env.DB_HOST || 'postgres',
  },
  {
    subdomain: 'client2',
    api_key: 'client2-api-key',
    database_name: 'ahha_client2_db',
    database_username: process.env.DB_USERNAME || 'postgres',
    database_password: process.env.DB_PASSWORD || 'P4ssw0rd!',
    database_port: process.env.DB_PORT || '5432',
    database_host: process.env.DB_HOST || 'postgres',
  },
];
