import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RewardItemSourceService } from './reward-item-source.service';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { CreateRewardItemSourceDto } from './dto/create-reward-item-source.dto';
import { validate } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

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
    it('normalizes a blank api key and masks the saved response', async () => {
      const dto = { name: 'Test Source', source_type: 'synthetic', apiKey: '' };
      const created = { id: '1', ...dto, apiKey: null };
      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create(dto as any);
      expect(result).toEqual({ ...created, apiKey: null });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        apiKey: null,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(created);
    });

    it('masks a plaintext api key without mutating the saved entity', async () => {
      const created = { id: '1', name: 'Test Source', apiKey: 'abc123456' };
      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create({ name: 'Test Source' } as any);

      expect(result.apiKey).toBe('abc***456');
      expect(created.apiKey).toBe('abc123456');
    });

    it.each([
      [null, null],
      ['', null],
      ['123456', '***'],
      ['1234567', '123***567'],
    ])('masks api key boundary %j', async (apiKey, masked) => {
      const created = { id: '1', name: 'Test Source', apiKey };
      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create({ name: 'Test Source' } as any);

      expect(result.apiKey).toBe(masked);
    });
  });

  describe('findAll', () => {
    it('should return paginated reward item sources', async () => {
      const paginationDto = { page: 0, size: 10 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [{ id: '1', apiKey: 'abcdef' }],
        1,
      ]);

      const result = await service.findAll(paginationDto as any);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].apiKey).toBe('***');
    });

    it('ignores unsupported sort fields', async () => {
      await service.findAll({
        page: 0,
        size: 10,
        sort: 'apiKey',
        order: 'ASC',
      } as any);
      expect(mockQueryBuilder.orderBy).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a reward item source by id', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        name: 'Test',
        apiKey: 'secret7',
      });
      const result = await service.findOne('1');
      expect(result.apiKey).toBe('sec***et7');
    });

    it('throws when the reward item source does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);
      await expect(service.findOne('missing')).rejects.toThrow(
        'Reward item source missing not found.',
      );
    });
  });

  describe('update', () => {
    it('should update a reward item source', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        name: 'Updated',
        apiKey: 'secret7',
      });
      const result = await service.update('1', { name: 'Updated' } as any);
      expect(result.apiKey).toBe('sec***et7');
      expect(mockRepository.update).toHaveBeenCalledWith('1', {
        name: 'Updated',
      });
    });

    it('throws when no source is updated', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      await expect(service.update('missing', {} as any)).rejects.toThrow(
        'Reward item source missing not found.',
      );
    });

    it('throws if the source disappears after the update', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(undefined);
      await expect(service.update('missing', {} as any)).rejects.toThrow(
        'Reward item source missing not found.',
      );
    });
  });

  describe('remove', () => {
    it('should remove a reward item source', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove('uuid-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('throws when no source is deleted', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('missing')).rejects.toThrow(
        'Reward item source missing not found.',
      );
    });
  });
});

describe('CreateRewardItemSourceDto validation', () => {
  const validateDto = (input: object) =>
    validate(Object.assign(new CreateRewardItemSourceDto(), input));

  it('accepts the required fields without apiKey', async () => {
    await expect(
      validateDto({ name: 'Synthetic', source_type: 'synthetic' }),
    ).resolves.toHaveLength(0);
  });

  it('rejects invalid required fields and URLs', async () => {
    await expect(
      validateDto({ name: '', source_type: 'synthetic' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({ name: 'Synthetic', source_type: '' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({
        name: 'Synthetic',
        source_type: 'synthetic',
        api_endpoint: 'not-a-url',
      }),
    ).resolves.not.toHaveLength(0);
  });

  it('accepts the fields used by the runtime validation pipe', async () => {
    const pipe = new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    });
    const value = await pipe.transform(
      { name: 'Synthetic', source_type: 'synthetic', apiKey: 'secret' },
      { type: 'body', metatype: CreateRewardItemSourceDto },
    );
    expect(value).toBeInstanceOf(CreateRewardItemSourceDto);
  });
});
