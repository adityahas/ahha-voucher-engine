import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ClientsService } from '../clients/clients.service';

/**
 * This service is responsible for managing the databases.
 * It provides methods to interact with the database with multiple data sources (clients).
 */

@Injectable()
export class DatabaseService {
  private _dataSources: Map<string, any> = new Map();

  constructor(private readonly clientService: ClientsService) {}

  async createConnection(name: string): Promise<DataSource> {
    if (this._dataSources.has(name)) {
      return this._dataSources.get(name);
    }

    const client = await this.clientService.findBy({
      database_name: name,
    });

    if (!client) {
      throw new NotFoundException(`Database ${name} not found.`);
    }

    const dataSource = new DataSource({
      name,
      type: 'postgres',
      host: client.database_host,
      port: client.database_port,
      username: client.database_username,
      password: client.database_password,
      database: client.database_name,
    });
    await dataSource.initialize();
    this._dataSources.set(name, dataSource);
    return dataSource;
  }

  getConnection(name: string): DataSource {
    if (!this._dataSources.has(name)) {
      throw new NotFoundException(`Connection ${name} not found.`);
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
}
