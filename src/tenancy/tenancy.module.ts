import { Global, Module, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { ClientsService } from '../client/client.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ClientsModule } from '../client/client.module';
import { EncryptionModule } from '../encryption/encryption.module';

export const CONNECTION = 'CONNECTION';

export const _dataSources: Map<string, any> = new Map();

@Global()
@Module({
  imports: [ClientsModule, EncryptionModule],
  providers: [
    {
      provide: CONNECTION,
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        clientService: ClientsService,
        encryptionService: EncryptionService,
      ): Promise<DataSource> => {
        const name = request['client'].database_name;
        if (!name) {
          throw new Error('Database name not found.');
        }
        if (_dataSources.has(name)) {
          return _dataSources.get(name);
        }

        const client = await clientService.findByDatabaseName(name);

        if (!client) {
          throw new NotFoundException(`Database ${name} not found.`);
        }

        try {
          const dataSource = new DataSource({
            name: name,
            type: 'postgres',
            host: client.database_host,
            port: Number(process.env.DB_PORT),
            username: client.database_username,
            password: encryptionService.decrypt(client.database_password),
            database: client.database_name,
            entities: ['dist/modules/**/*.entity{.ts,.js}'],
            synchronize: process.env.DB_SYNC === 'true',
          });
          await dataSource.initialize();
          _dataSources.set(name, dataSource);
          return dataSource;
        } catch (error) {
          console.log(error);
          throw new Error('Failed to connect to the database.');
        }
      },
      inject: [REQUEST, ClientsService, EncryptionService],
    },
  ],
  exports: [CONNECTION],
})
export class TenancyModule {}
