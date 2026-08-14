import { Test, TestingModule } from '@nestjs/testing';
import { VoucherService } from './voucher.service';
import { DataSource } from 'typeorm';
import {
  VoucherEntity,
  ClaimPeriod,
} from '@core/loyalty/voucher/entities/voucher.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { NotFoundException } from '@nestjs/common';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

describe('VoucherService', () => {
  let service: VoucherService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  } as any;

  const mockVoucherRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  } as any;

  const mockUserRepository = {
    findBy: jest.fn(),
    save: jest.fn(),
  } as any;
  const mockVoucherCategoryRepository = {
    findBy: jest.fn(),
  } as any;

  const mockDataSource = {
    getRepository: jest.fn((entity) => {
      if (entity === VoucherEntity) return mockVoucherRepository;
      if (entity === LoyaltyUserEntity) return mockUserRepository;
      if (entity === VoucherCategoryEntity)
        return mockVoucherCategoryRepository;
      return null;
    }),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<VoucherService>(VoucherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated vouchers', async () => {
      const paginationDto: BasePaginationDto = {
        page: 0,
        size: 10,
        search: '',
        sort: 'name',
        order: 'ASC',
      };

      const mockVouchers = [
        { id: '1', name: 'Voucher 1' },
        { id: '2', name: 'Voucher 2' },
      ];
      const total = 2;

      mockQueryBuilder.getManyAndCount = jest
        .fn()
        .mockResolvedValueOnce([mockVouchers, total]);

      const result = await service.findAll(paginationDto);

      expect(result).toEqual({
        code: 'SUCCESS',
        message: 'Vouchers retrieved successfully',
        data: mockVouchers,
        pagination: {
          page: paginationDto.page,
          size: paginationDto.size,
          total: total,
        },
      });
      expect(mockVoucherRepository.createQueryBuilder).toHaveBeenCalledWith(
        'voucher',
      );
      expect(
        mockVoucherRepository.createQueryBuilder().skip,
      ).toHaveBeenCalledWith(0);
      expect(
        mockVoucherRepository.createQueryBuilder().take,
      ).toHaveBeenCalledWith(10);
      expect(
        mockVoucherRepository.createQueryBuilder().orderBy,
      ).toHaveBeenCalledWith('voucher.name', 'ASC');
      expect(
        mockVoucherRepository.createQueryBuilder().leftJoinAndSelect,
      ).toHaveBeenCalledWith('voucher.categories', 'categories');
      expect(
        mockVoucherRepository.createQueryBuilder().leftJoinAndSelect,
      ).toHaveBeenCalledWith('voucher.target_users', 'target_users');
    });

    it('should handle search parameter', async () => {
      const paginationDto: BasePaginationDto = {
        page: 0,
        size: 10,
        search: 'test',
        sort: 'name',
        order: 'ASC',
      };

      mockVoucherRepository
        .createQueryBuilder()
        .getManyAndCount.mockResolvedValueOnce([[], 0]);

      await service.findAll(paginationDto);

      expect(
        mockVoucherRepository.createQueryBuilder().where,
      ).toHaveBeenCalledWith('voucher.name ILIKE :search', {
        search: '%test%',
      });
    });

    it('should handle empty search and sort parameters', async () => {
      const paginationDto: BasePaginationDto = {
        page: 0,
        size: 10,
        search: '',
        sort: '',
        order: undefined,
      };

      mockVoucherRepository
        .createQueryBuilder()
        .getManyAndCount.mockResolvedValueOnce([[], 0]);

      await service.findAll(paginationDto);

      expect(
        mockVoucherRepository.createQueryBuilder().where,
      ).not.toHaveBeenCalled();
      expect(
        mockVoucherRepository.createQueryBuilder().orderBy,
      ).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update voucher and persist relations correctly', async () => {
      const code = 'VOUCHER1';
      const updateDto = {
        description: 'Updated Description',
        target_users: ['user-1', 'user-2'],
        categories: [{ slug: 'cat-1' }],
      };

      const mockVoucher = { code, description: 'Old Description' } as any;
      const mockUsers = [
        { core_user_id: 'user-1' },
        { core_user_id: 'user-2' },
      ];
      const mockCategories = [{ slug: 'cat-1' }];

      mockVoucherRepository.findOne.mockResolvedValueOnce(mockVoucher);
      mockUserRepository.findBy.mockResolvedValueOnce(mockUsers);
      mockVoucherCategoryRepository.findBy.mockResolvedValueOnce(
        mockCategories,
      );
      mockVoucherRepository.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.update(code, updateDto as any);

      expect(mockVoucherRepository.findOne).toHaveBeenCalledWith({
        where: { code },
        relations: ['categories', 'allow_combine_categories', 'target_users'],
      });
      expect(mockUserRepository.findBy).toHaveBeenCalled();
      expect(mockVoucherCategoryRepository.findBy).toHaveBeenCalled();

      // Verify that relations are assigned as entities, not raw arrays
      expect(result.target_users).toEqual(mockUsers);
      expect(result.categories).toEqual(mockCategories);
      expect(result.description).toBe('Updated Description');
    });

    it('should create missing loyalty users during update', async () => {
      const code = 'VOUCHER1';
      const updateDto = {
        target_users: ['new-user'],
      };

      const mockVoucher = { code } as any;
      const mockSavedUser = { core_user_id: 'new-user', id: 'uuid-1' };

      mockVoucherRepository.findOne.mockResolvedValueOnce(mockVoucher);
      mockUserRepository.findBy.mockResolvedValueOnce([]); // No existing users
      mockUserRepository.save.mockResolvedValueOnce([mockSavedUser]);
      mockVoucherRepository.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.update(code, updateDto as any);

      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.target_users).toEqual([mockSavedUser]);
    });
  });

  describe('create', () => {
    it('should create voucher and link existing/new users', async () => {
      const createDto = {
        code: 'NEWVOUCHER',
        target_users: ['user-1'],
        categories: [],
      };

      const mockUsers = [{ core_user_id: 'user-1' }];
      mockUserRepository.findBy.mockResolvedValueOnce(mockUsers);
      mockVoucherRepository.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.create(createDto as any);

      expect(result.code).toBe('NEWVOUCHER');
      expect(result.target_users).toEqual(mockUsers);
      expect(mockVoucherRepository.save).toHaveBeenCalled();
    });

    it('resolves categories and allow-combine categories before saving', async () => {
      const categories = [{ slug: 'food' }];
      const combineCategories = [{ slug: 'drink' }];
      mockVoucherCategoryRepository.findBy
        .mockResolvedValueOnce(categories)
        .mockResolvedValueOnce(combineCategories);
      mockVoucherRepository.save.mockImplementation((value) =>
        Promise.resolve(value),
      );

      const result = await service.create({
        code: 'COMBO',
        categories,
        allow_combine_categories: combineCategories,
      } as any);

      expect(result.categories).toEqual(categories);
      expect(result.allow_combine_categories).toEqual(combineCategories);
      expect(mockVoucherCategoryRepository.findBy).toHaveBeenCalledTimes(2);
    });

    it('persists claim_period from the DTO', async () => {
      mockVoucherRepository.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.create({
        code: 'DAILYV',
        claim_period: ClaimPeriod.DAILY,
      } as any);

      expect(result.claim_period).toBe(ClaimPeriod.DAILY);
      expect(mockVoucherRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('loads a voucher and its relations by code', async () => {
      const voucher = { code: 'VOU-1' };
      mockVoucherRepository.findOne.mockResolvedValue(voucher);

      await expect(service.findOne('VOU-1')).resolves.toBe(voucher);
      expect(mockVoucherRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'VOU-1' },
        relations: ['categories', 'allow_combine_categories', 'target_users'],
      });
    });
  });

  describe('remove', () => {
    it('soft deletes the voucher by code', async () => {
      mockVoucherRepository.softDelete = jest.fn().mockResolvedValue({
        affected: 1,
      });

      await service.remove('VOU-1');

      expect(mockVoucherRepository.softDelete).toHaveBeenCalledWith('VOU-1');
    });
  });

  it('throws NotFoundException when updating an unknown voucher', async () => {
    mockVoucherRepository.findOne.mockResolvedValue(null);

    await expect(service.update('MISSING', {} as any)).rejects.toThrow(
      NotFoundException,
    );
  });
});
