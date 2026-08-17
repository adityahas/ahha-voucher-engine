import { Test, TestingModule } from '@nestjs/testing';
import { QuestService } from './quest.service';
import { DataSource } from 'typeorm';

describe('QuestService', () => {
  let service: QuestService;

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    }),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<QuestService>(QuestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
