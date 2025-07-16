import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { EncryptionService } from '@core/encryption';
import { ClientEntity } from '@core/database/entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * This service is responsible for managing the databases.
 * It provides methods to interact with the database with multiple data sources (client).
 */

@Injectable()
export class DatabaseService {
  private _dataSources: Map<string, DataSource> = new Map();

  constructor(
    private readonly encryptionService: EncryptionService,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {}

  async getConnection(
    databaseName: string,
    entityPath?: string,
  ): Promise<DataSource> {
    if (!databaseName) {
      throw new Error('Database name not specified.');
    }

    const client = await this.findByDatabaseName(databaseName);
    if (!client) {
      throw new NotFoundException(`Database ${databaseName} not found.`);
    }

    if (!entityPath) {
      entityPath = __dirname + '/**/*.entity{.ts,.js}';
    }

    if (!this._dataSources.has(databaseName)) {
      await this.createConnection(databaseName, (client, password) => {
        return new DataSource({
          type: 'postgres',
          host: client.database_host,
          port: Number(process.env.DB_PORT),
          username: client.database_username,
          password: password,
          database: client.database_name,
          namingStrategy: new SnakeNamingStrategy(),
          entities: [entityPath],
          synchronize: process.env.DB_SYNC === 'true',
        });
      });
    }

    return this._dataSources.get(databaseName);
  }

  async createConnection(
    name: string,
    initDatasourceFn: (client: ClientEntity, password: string) => DataSource,
  ): Promise<DataSource> {
    if (this._dataSources.has(name)) {
      return this._dataSources.get(name);
    }

    const client = await this.findByDatabaseName(name);
    if (!client) {
      throw new NotFoundException(`Database ${name} not found.`);
    }

    try {
      const password = this.encryptionService.decrypt(client.database_password);
      const dataSource = initDatasourceFn(client, password);
      await dataSource.initialize();
      this._dataSources.set(name, dataSource);

      // Log the loaded entities for debugging purposes
      const loadedEntities = dataSource.entityMetadatas.map((e) => e.name);
      console.log(`Loaded entities for ${name}:`, loadedEntities);

      return dataSource;
    } catch (error) {
      console.log(error);
      throw new NotFoundException(
        `Failed to connect to database ${name}: ${error.message}`,
      );
    }
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
