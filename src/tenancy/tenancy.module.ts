import { Global, Module, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { ClientsService } from '../client/client.service';
import { ClientsModule } from '../client/client.module';
import { EncryptionModule } from '../encryption/encryption.module';
import { DatabaseService } from '../database/database.service';

export const CONNECTION = 'CONNECTION';

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
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const name = request['client'].database_name;
        if (!name) {
          throw new Error('Database name not specified.');
        }

        const dataSource = databaseService.getConnection(name);
        const client = await clientService.findByDatabaseName(name);

        if (!client || !dataSource) {
          throw new NotFoundException(`Database ${name} not found.`);
        }

        return dataSource;
      },
      inject: [REQUEST, ClientsService, DatabaseService],
    },
  ],
  exports: [CONNECTION],
})
export class TenancyModule {}
