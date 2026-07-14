import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RewardItemSourceService } from './reward-item-source.service';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';

describe('RewardItemSourceService', () => {
  let service: RewardItemSourceService;
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataSource.getRepository.mockReturnValue(mockRepository);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardItemSourceService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RewardItemSourceService>(RewardItemSourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(mockDataSource.getRepository).toHaveBeenCalledWith(
      RewardItemSourceEntity,
    );
  });

  describe('create', () => {
    it('should create a reward item source', async () => {
      const dto = { name: 'Test Source', point: 50 };
      const created = { id: '1', ...dto };
      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create(dto as any);
      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalledWith(created);
    });
  });

  describe('findAll', () => {
    it('should return paginated reward item sources', async () => {
      const paginationDto = { page: 0, size: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: '1' }], 1]);

      const result = await service.findAll(paginationDto as any);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a reward item source by id', async () => {
      mockRepository.findOne.mockResolvedValue({ id: '1', name: 'Test' });
      const result = await service.findOne('1');
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a reward item source', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({ id: '1', name: 'Updated' });
      const result = await service.update('1', { name: 'Updated' } as any);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a reward item source', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
