import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { VoucherService } from './voucher.service';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { VoucherUsageEntity } from '@core/loyalty/voucher/entities/voucher-usage.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('VoucherService', () => {
  let service: VoucherService;
  let dataSource: DataSource;
  let voucherRepo: Repository<VoucherEntity>;
  let claimRepo: Repository<VoucherClaimEntity>;
  let usageRepo: Repository<VoucherUsageEntity>;
  let userRepo: Repository<LoyaltyUserEntity>;

  const mockUser = { id: 1, core_user_id: 'user-id' };
  const mockVoucher = { code: 'VOU-10', quota: 10 };
  const mockClaim = { id: 1, voucher: mockVoucher, user: mockUser };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    manager: {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    },
  };

  const mockDataSource = {
    getRepository: jest.fn((entity) => {
      if (entity === VoucherEntity) return mockRepository;
      if (entity === VoucherClaimEntity) return mockRepository;
      if (entity === VoucherUsageEntity) return mockRepository;
      if (entity === LoyaltyUserEntity) return mockRepository;
      return mockRepository;
    }),
  };

  beforeEach(async () => {
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
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('useVoucher', () => {
    let mockEntityManager: Partial<EntityManager>;

    beforeEach(() => {
      mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(mockRepository),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };
    });

    it('should successfully record usage if claim exists and not used', async () => {
      // Arrange
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser); // getOrCreateLoyaltyUser
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockClaim) // find claim
        .mockResolvedValueOnce(null); // find usage (none)
      (mockEntityManager.create as jest.Mock).mockReturnValue({ id: 1 });

      // Act
      await service.useVoucher('user-id', 'VOU-10', mockEntityManager as any);

      // Assert
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if voucher not claimed', async () => {
      // Arrange
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockEntityManager.findOne as jest.Mock).mockResolvedValueOnce(null); // find claim (not found)

      // Act & Assert
      await expect(
        service.useVoucher('user-id', 'VOU-10', mockEntityManager as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if voucher already used', async () => {
      // Arrange
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockClaim) // find claim
        .mockResolvedValueOnce({ id: 1 }); // find usage (already exists)

      // Act & Assert
      await expect(
        service.useVoucher('user-id', 'VOU-10', mockEntityManager as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
