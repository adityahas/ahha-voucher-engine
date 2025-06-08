import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClientsService } from '../client/client.service';
import { EncryptionService } from '../encryption/encryption.service';
import * as bcrypt from 'bcrypt';

/**
 * This service is responsible for managing the databases.
 * It provides methods to interact with the database with multiple data sources (client).
 */

@Injectable()
export class DatabaseService {
  private _dataSources: Map<string, any> = new Map();

  constructor(
    private readonly clientService: ClientsService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createConnection(name: string): Promise<DataSource> {
    if (this._dataSources.has(name)) {
      return this._dataSources.get(name);
    }

    const client = await this.clientService.findByDatabaseName(name);

    if (!client) {
      throw new NotFoundException(`Database ${name} not found.`);
    }

    try {
      const dataSource = new DataSource({
        name,
        type: 'postgres',
        host: client.database_host,
        port: Number(process.env.DB_PORT),
        username: client.database_username,
        password: this.encryptionService.decrypt(client.database_password),
        database: client.database_name,
        entities: ['dist/**/*.entity.ts', 'dist/**/*.entity.js'],
        synchronize: process.env.DB_SYNC === 'true',
      });
      await dataSource.initialize();
      this._dataSources.set(name, dataSource);
      return dataSource;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to connect to the database.');
    }
  }

  async getConnection(name: string): Promise<DataSource> {
    if (!this._dataSources.has(name)) {
      await this.createConnection(name);
    }
    return this._dataSources.get(name);
  }

  async closeConnection(name: string): Promise<void> {
    if (this._dataSources.has(name)) {
      const dataSource = this._dataSources.get(name);
      await dataSource.close();
      this._dataSources.delete(name);
    }
  }

  checkConnectionExists(name: string): boolean {
    return this._dataSources.has(name);
  }

  async comparePassword(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }
}
