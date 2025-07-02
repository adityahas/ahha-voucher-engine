import { Global, Module, NotFoundException, Scope } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { REQUEST } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { EncryptionModule } from '@core/encryption';

export const CONNECTION = 'CONNECTION';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Client]), EncryptionModule],
  providers: [
    DatabaseService,
    {
      provide: CONNECTION,
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const databaseName = request['client'].database_name;
        if (!databaseName) {
          throw new Error('Database name not specified.');
        }

        const dataSource = databaseService.getConnection(databaseName);
        const client = await databaseService.findByDatabaseName(databaseName);

        if (!client || !dataSource) {
          throw new NotFoundException(`Database ${databaseName} not found.`);
        }

        return dataSource;
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  exports: [DatabaseService, CONNECTION],
})
export class DatabaseModule {}
