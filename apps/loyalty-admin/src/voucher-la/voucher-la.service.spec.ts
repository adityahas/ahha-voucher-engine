import { Test, TestingModule } from '@nestjs/testing';
import { VoucherLaService } from './voucher-la.service';
import { DataSource, Repository } from 'typeorm';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

describe('VoucherLaService', () => {
  let service: VoucherLaService;
  let voucherRepository: jest.Mocked<Repository<VoucherEntity>>;
  let userRepository: jest.Mocked<Repository<LoyaltyUserEntity>>;
  let voucherCategoryRepository: jest.Mocked<Repository<VoucherCategoryEntity>>;
  let dataSource: DataSource;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
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
        VoucherLaService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<VoucherLaService>(VoucherLaService);
    voucherRepository = mockDataSource.getRepository(VoucherEntity);
    userRepository = mockDataSource.getRepository(LoyaltyUserEntity);
    voucherCategoryRepository = mockDataSource.getRepository(
      VoucherCategoryEntity,
    );
    dataSource = module.get<DataSource>(DataSource);
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
});
