import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { EncryptionService } from '@core/encryption';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientEntity } from './entities/client.entity';

describe('DatabaseService', () => {
  let service: DatabaseService;

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn().mockReturnValue('password'),
  };

  const mockClientRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        { provide: EncryptionService, useValue: mockEncryptionService },
        {
          provide: getRepositoryToken(ClientEntity),
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
