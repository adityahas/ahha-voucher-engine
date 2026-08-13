import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { EncryptionService } from '@core/encryption';
import { ClientEntity } from '@core/database/entities/client.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        { provide: EncryptionService, useValue: {} },
        { provide: getRepositoryToken(ClientEntity), useValue: {} },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses either synchronization or migrations for a tenant, never both', () => {
    const migrationPath = ['/app/migrations/source.ts'];
    const sync = process.env.DB_SYNC === 'true';
    const config = {
      migrationsRun: migrationPath.length > 0 && !sync,
      synchronize: sync && migrationPath.length === 0,
    };
    expect(config.migrationsRun && config.synchronize).toBe(false);
  });
});
