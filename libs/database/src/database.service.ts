import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { EncryptionService } from '@core/encryption';
import { Client } from '@core/database/entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * This service is responsible for managing the databases.
 * It provides methods to interact with the database with multiple data sources (client).
 */

@Injectable()
export class DatabaseService {
  private _dataSources: Map<string, any> = new Map();

  constructor(
    private readonly encryptionService: EncryptionService,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async createConnection(name: string): Promise<DataSource> {
    if (this._dataSources.has(name)) {
      return this._dataSources.get(name);
    }

    const client = await this.findByDatabaseName(name);

    if (!client) {
      throw new NotFoundException(`Database ${name} not found.`);
    }

    try {
      const password = this.encryptionService.decrypt(client.database_password);
      const dataSource = new DataSource({
        name,
        type: 'postgres',
        host: client.database_host,
        port: Number(process.env.DB_PORT),
        username: client.database_username,
        password: password,
        database: client.database_name,
        namingStrategy: new SnakeNamingStrategy(),
        entities: ['dist/modules/**/*.entity{.ts,.js}'],
        synchronize: process.env.DB_SYNC === 'true',
      });
      await dataSource.initialize();
      this._dataSources.set(name, dataSource);
      return dataSource;
    } catch (error) {
      console.log(error);
      throw new NotFoundException(
        `Failed to connect to database ${name}: ${error.message}`,
      );
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

  async findByDatabaseName(databaseName: string) {
    return this.clientRepository.findOne({
      where: { database_name: databaseName },
    });
  }
}
