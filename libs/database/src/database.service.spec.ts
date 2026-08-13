import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { EncryptionService } from '@core/encryption';
import { ClientEntity } from '@core/database/entities/client.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('DatabaseService', () => {
  let service: DatabaseService;
  const client = {
    database_host: 'localhost',
    database_username: 'postgres',
    database_password: 'encrypted',
    database_name: 'tenant_db',
  } as ClientEntity;

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

  it.each(['true', 'false'])(
    'always runs configured migrations when DB_SYNC=%s',
    async (dbSync) => {
      process.env.DB_SYNC = dbSync;
      const repository = (service as any).clientRepository;
      repository.findOne = jest.fn().mockResolvedValue(client);
      (service as any).encryptionService.decrypt = jest
        .fn()
        .mockReturnValue('password');
      const createConnection = jest
        .spyOn(service, 'createConnection')
        .mockImplementation(async (_name, initDataSource) => {
          const dataSource = initDataSource(client, 'password');
          return dataSource;
        });

      await service.getConnection('tenant_db', '/app/migrations/source.ts');

      const dataSource = createConnection.mock.results[0].value;
      await expect(dataSource).resolves.toMatchObject({
        options: expect.objectContaining({
          migrationsRun: true,
          synchronize: false,
        }),
      });
    },
  );

  afterEach(() => {
    delete process.env.DB_SYNC;
  });
});
