import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { VoucherService } from './voucher.service';
import {
  VoucherEntity,
  DiscountType,
  VoucherType,
} from '@core/loyalty/voucher/entities/voucher.entity';
import { VoucherClaimEntity } from '@core/loyalty/voucher/entities/voucher-claim.entity';
import { VoucherUsageEntity } from '@core/loyalty/voucher/entities/voucher-usage.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { ProductEntity } from '@core/product/entities/product.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VoucherResponseDto } from './dto/voucher-response.dto';

describe('VoucherService', () => {
  let service: VoucherService;
  let dataSource: DataSource;
  let voucherRepo: Repository<VoucherEntity>;
  let claimRepo: Repository<VoucherClaimEntity>;

  // ---------------------------------------------------------------
  // Reusable mock factories
  // ---------------------------------------------------------------
  const mockUser = { id: 1, core_user_id: 'user-id' };

  const makeVoucher = (overrides: Partial<VoucherEntity> = {}) =>
    ({
      code: 'VOU-10',
      voucher_type: VoucherType.CLAIMABLE,
      description: 'desc',
      quota: 10,
      image: null,
      discount_type: DiscountType.PERCENTAGE,
      discount_value: 25,
      categories: [],
      allow_combine_categories: [],
      validities: [],
      bindings: [],
      claims: [],
      usages: [],
      target_users: [],
      ...overrides,
    }) as VoucherEntity;

  let createQueryBuilder: jest.Mock;

  const buildQueryBuilder = (getManyResult: any[] = []) => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(getManyResult),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  const mockManager = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: mockManager,
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
    jest.clearAllMocks();
    createQueryBuilder = mockRepository.createQueryBuilder as jest.Mock;

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
    voucherRepo = dataSource.getRepository(VoucherEntity) as any;
    claimRepo = dataSource.getRepository(VoucherClaimEntity) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------
  // findEligibleVouchers
  // ---------------------------------------------------------------
  describe('findEligibleVouchers', () => {
    it('returns all vouchers when no user and no bindings are provided', async () => {
      buildQueryBuilder([makeVoucher()]);

      const result = await service.findEligibleVouchers({
        bindings: [],
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(VoucherResponseDto);
      expect(result[0].code).toBe('VOU-10');
    });

    it('joins target_users when a user_id is provided', async () => {
      const qb = buildQueryBuilder([makeVoucher()]);

      await service.findEligibleVouchers({
        user_id: 'user-id',
        bindings: [],
      });

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'voucher.target_users',
        'user',
        'user.core_user_id = :userId',
        { userId: 'user-id' },
      );
    });

    it('does not join target_users when user_id is absent', async () => {
      const qb = buildQueryBuilder([makeVoucher()]);

      await service.findEligibleVouchers({ bindings: [] });

      const joinCalls = qb.leftJoinAndSelect.mock.calls.map((c) => c[0]);
      expect(joinCalls).not.toContain('voucher.target_users');
    });

    it('filters by a single binding with a where clause', async () => {
      const qb = buildQueryBuilder([makeVoucher()]);

      await service.findEligibleVouchers({
        bindings: [{ bind_type: 'category', bind_value: 'groceries' }] as any,
      });

      expect(qb.leftJoin).toHaveBeenCalledWith(
        'voucher.bindings',
        'binding_filter',
      );
      expect(qb.where).toHaveBeenCalledWith(
        '(binding_filter.bind_type = :bindType0 AND binding_filter.bind_value = :bindValue0)',
        { bindType0: 'category', bindValue0: 'groceries' },
      );
      expect(qb.orWhere).not.toHaveBeenCalled();
    });

    it('chains multiple bindings with OR clauses', async () => {
      const qb = buildQueryBuilder([makeVoucher()]);

      await service.findEligibleVouchers({
        bindings: [
          { bind_type: 'category', bind_value: 'groceries' },
          { bind_type: 'product', bind_value: 'prod-1' },
        ] as any,
      });

      expect(qb.where).toHaveBeenCalledTimes(1);
      expect(qb.orWhere).toHaveBeenCalledWith(
        '(binding_filter.bind_type = :bindType1 AND binding_filter.bind_value = :bindValue1)',
        { bindType1: 'product', bindValue1: 'prod-1' },
      );
    });

    it('applies no filter clause when bindings array is empty', async () => {
      const qb = buildQueryBuilder([makeVoucher()]);

      await service.findEligibleVouchers({ bindings: [] });

      expect(qb.leftJoin).not.toHaveBeenCalled();
      expect(qb.where).not.toHaveBeenCalled();
    });

    it('maps entities to response DTOs with mapped binding values', async () => {
      buildQueryBuilder([
        makeVoucher({
          bindings: [{ bind_type: 'product', bind_value: 'prod-1' }] as any,
        }),
      ]);

      const result = await service.findEligibleVouchers({ bindings: [] });

      expect(result[0].bindings).toEqual([
        { bind_type: 'product', bind_value: 'prod-1' },
      ]);
    });

    it('returns an empty array when no vouchers match', async () => {
      buildQueryBuilder([]);

      const result = await service.findEligibleVouchers({ bindings: [] });

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------
  // getClaimedVouchers
  // ---------------------------------------------------------------
  describe('getClaimedVouchers', () => {
    it('throws an error when userId is missing', async () => {
      await expect(
        service.getClaimedVouchers('', {
          page: 0,
          size: 10,
          search: '',
          sort: '',
          order: 'ASC',
        } as any),
      ).rejects.toThrow('User ID is required to fetch claimed vouchers');
    });

    it('returns paginated claimed vouchers for a user', async () => {
      const mockClaim = {
        id: 1,
        created_at: new Date(),
        voucher: makeVoucher(),
        user: mockUser,
      };
      (claimRepo.findAndCount as jest.Mock).mockResolvedValue([[mockClaim], 1]);

      const result = await service.getClaimedVouchers('user-id', {
        page: 0,
        size: 10,
      } as any);

      expect(result.code).toBe('SUCCESS');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].voucher.code).toBe('VOU-10');
      expect(result.pagination).toEqual({ page: 0, total: 1, size: 10 });
      expect(claimRepo.findAndCount).toHaveBeenCalledWith({
        where: { user: { core_user_id: 'user-id' } },
        relations: ['voucher', 'voucher.validities', 'user'],
        skip: 0,
        take: 10,
      });
    });

    it('applies correct skip based on page/size', async () => {
      (claimRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await service.getClaimedVouchers('user-id', {
        page: 2,
        size: 25,
      } as any);

      expect(claimRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 25 }),
      );
    });

    it('returns empty data when no claims exist', async () => {
      (claimRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.getClaimedVouchers('user-id', {
        page: 0,
        size: 10,
      } as any);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // claimVoucher
  // ---------------------------------------------------------------
  describe('claimVoucher', () => {
    let txManager: any;
    let txUserRepository: any;
    let txVoucherRepository: any;

    beforeEach(() => {
      txUserRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        create: jest.fn().mockImplementation((_, data) => data),
        save: jest.fn().mockImplementation((_, data) => Promise.resolve(data)),
      };
      txVoucherRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
      };
      txManager = {
        findOne: jest.fn(),
        getRepository: jest.fn((entity) => {
          if (entity === LoyaltyUserEntity) return txUserRepository;
          if (entity === VoucherEntity) return txVoucherRepository;
          return {};
        }),
        create: jest.fn(),
        save: jest.fn(),
      };
      (mockManager.transaction as jest.Mock).mockImplementation((cb) =>
        cb(txManager),
      );
    });

    it('throws NotFoundException when voucher does not exist', async () => {
      txManager.findOne.mockResolvedValueOnce(null);

      await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when quota is exhausted', async () => {
      const voucher = makeVoucher({ quota: 0 });
      txManager.findOne.mockResolvedValueOnce(voucher);

      await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
        'Voucher quota exhausted',
      );
    });

    it('throws BadRequestException when user is not a target user', async () => {
      const voucher = makeVoucher();
      txManager.findOne.mockResolvedValueOnce(voucher);
      txManager.findOne.mockResolvedValueOnce(null); // existing claim
      txVoucherRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ core_user_id: 'other-user' }]),
      });

      await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
        'Voucher is not valid for this user',
      );
    });

    it('throws BadRequestException when voucher already claimed', async () => {
      const voucher = makeVoucher();
      txManager.findOne.mockResolvedValueOnce(voucher);
      txManager.findOne.mockResolvedValueOnce({ id: 9 }); // existing claim

      await expect(service.claimVoucher('user-id', 'VOU-10')).rejects.toThrow(
        'You have already claimed this voucher',
      );
    });

    it('claims successfully, decrements quota and persists claim', async () => {
      const voucher = makeVoucher({ quota: 10 });
      txManager.findOne.mockResolvedValueOnce(voucher);
      txManager.findOne.mockResolvedValueOnce(null); // no existing claim
      txManager.create.mockImplementation((_, data) => data);
      txManager.save.mockImplementation((_, data) => Promise.resolve(data));

      const result = await service.claimVoucher('user-id', 'VOU-10');

      expect(result).toEqual({
        success: true,
        message: 'Voucher claimed successfully!',
      });
      expect(voucher.quota).toBe(9);
      expect(txManager.create).toHaveBeenCalledWith(VoucherClaimEntity, {
        voucher: { code: 'VOU-10' },
        user: mockUser,
      });
      expect(txManager.save).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------
  // useVoucher
  // ---------------------------------------------------------------
  describe('useVoucher', () => {
    let mockEntityManager: Partial<EntityManager>;

    beforeEach(() => {
      mockEntityManager = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(mockUser),
        }),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      };
    });

    it('should successfully record usage if claim exists and not used', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser); // getOrCreateLoyaltyUser
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockClaim()) // find claim
        .mockResolvedValueOnce(null); // find usage (none)
      (mockEntityManager.create as jest.Mock).mockReturnValue({
        id: 1,
        voucher: { code: 'VOU-10' },
        user: mockUser,
      });
      (mockEntityManager.save as jest.Mock).mockResolvedValue({ id: 1 });

      await service.useVoucher('user-id', 'VOU-10', mockEntityManager as any);

      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if voucher not claimed', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockEntityManager.findOne as jest.Mock).mockResolvedValueOnce(null); // find claim (not found)

      await expect(
        service.useVoucher('user-id', 'VOU-10', mockEntityManager as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if voucher already used', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockEntityManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockClaim()) // find claim
        .mockResolvedValueOnce({ id: 1 }); // find usage (already exists)

      await expect(
        service.useVoucher('user-id', 'VOU-10', mockEntityManager as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------
  // validateAndCalculateDiscount (permutation matrix)
  // ---------------------------------------------------------------
  describe('validateAndCalculateDiscount', () => {
    beforeEach(() => {
      (voucherRepo.findOne as jest.Mock).mockReset();
      (voucherRepo.findOne as jest.Mock).mockResolvedValue(makeVoucher());
    });

    it('returns invalid when voucher is not found', async () => {
      (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.validateAndCalculateDiscount(
        'MISSING',
        1000,
        'user-id',
      );

      expect(result).toEqual({
        isValid: false,
        discountAmount: 0,
        finalPrice: 1000,
        message: 'Voucher not found',
      });
    });

    it('returns invalid when quota is exhausted', async () => {
      (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
        makeVoucher({ quota: 0 }),
      );

      const result = await service.validateAndCalculateDiscount(
        'VOU-10',
        1000,
        'user-id',
      );

      expect(result.message).toBe('Voucher quota exhausted');
      expect(result.isValid).toBe(false);
    });

    describe('validity periods', () => {
      it('passes validity check when voucher has no validities', async () => {
        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );
        expect(result.isValid).toBe(true);
      });

      it('passes when an active validity window exists', async () => {
        const now = new Date();
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            validities: [
              {
                start_date: new Date(now.getTime() - 10000),
                end_date: new Date(now.getTime() + 10000),
              },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.isValid).toBe(true);
      });

      it('fails when validity window has ended', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            validities: [
              {
                start_date: new Date('2020-01-01'),
                end_date: new Date('2020-12-31'),
              },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result).toMatchObject({
          isValid: false,
          message: 'Voucher is not valid at this time',
        });
      });

      it('fails when validity window has not started yet', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            validities: [
              {
                start_date: new Date('2099-01-01'),
                end_date: new Date('2099-12-31'),
              },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.message).toBe('Voucher is not valid at this time');
        expect(result.isValid).toBe(false);
      });

      it('passes when at least one of several validities is active', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            validities: [
              {
                start_date: new Date('2020-01-01'),
                end_date: new Date('2020-12-31'),
              },
              {
                start_date: new Date('2021-01-01'),
                end_date: new Date('2099-12-31'),
              },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.isValid).toBe(true);
      });
    });

    describe('target users', () => {
      it('passes when voucher has no target users', async () => {
        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );
        expect(result.isValid).toBe(true);
      });

      it('passes when user is in target users list', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            target_users: [{ core_user_id: 'user-id' }] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.isValid).toBe(true);
      });

      it('fails when user is not in target users list', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            target_users: [{ core_user_id: 'other-user' }] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result).toMatchObject({
          isValid: false,
          message: 'Voucher is not valid for this user',
          finalPrice: 1000,
        });
      });
    });

    describe('bindings', () => {
      it('passes when voucher has no bindings', async () => {
        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );
        expect(result.isValid).toBe(true);
      });

      it('passes when product binding matches productId', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            bindings: [{ bind_type: 'product', bind_value: 'prod-1' }] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
          'prod-1',
        );

        expect(result.isValid).toBe(true);
      });

      it('fails when product binding does not match productId', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            bindings: [{ bind_type: 'product', bind_value: 'prod-1' }] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
          'prod-2',
        );

        expect(result).toMatchObject({
          isValid: false,
          message: 'Voucher is not valid for this product or category',
        });
      });

      it('passes when category binding matches a product category', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            bindings: [
              { bind_type: 'category', bind_value: 'groceries' },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
          'prod-1',
          ['groceries', 'snacks'],
        );

        expect(result.isValid).toBe(true);
      });

      it('fails when category binding matches no product category', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            bindings: [
              { bind_type: 'category', bind_value: 'groceries' },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
          'prod-1',
          ['electronics'],
        );

        expect(result.isValid).toBe(false);
      });

      it('fails when supported binding type does not match', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            bindings: [
              { bind_type: 'product_sku', bind_value: 'SKU-1' },
            ] as any,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
          'prod-1',
          ['electronics'],
        );

        expect(result.isValid).toBe(false);
      });
    });

    describe('tier bindings', () => {
      it('rejects voucher bound to a tier the user does not have', async () => {
        (voucherRepo.findOne as jest.Mock)
          .mockResolvedValueOnce(
            makeVoucher({
              discount_type: DiscountType.PERCENTAGE,
              discount_value: 20,
              bindings: [
                { bind_type: 'tier', bind_value: 'gold-tier-id' },
              ] as any,
            }),
          )
          .mockResolvedValueOnce({
            id: 'u1',
            core_user_id: 'user-id',
            tier: { id: 'bronze-tier-id' },
          });

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          100000,
          'user-id',
          'prod-1',
          ['Food'],
        );

        expect(result).toMatchObject({
          isValid: false,
          discountAmount: 0,
          finalPrice: 100000,
          message: 'Voucher is not valid for this user',
        });
      });

      it('accepts voucher bound only to a tier the user has', async () => {
        (voucherRepo.findOne as jest.Mock)
          .mockResolvedValueOnce(
            makeVoucher({
              discount_type: DiscountType.PERCENTAGE,
              discount_value: 20,
              bindings: [
                { bind_type: 'tier', bind_value: 'gold-tier-id' },
              ] as any,
            }),
          )
          .mockResolvedValueOnce({
            id: 'u1',
            core_user_id: 'user-id',
            tier: { id: 'gold-tier-id' },
          });

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          100000,
          'user-id',
          'prod-1',
          ['Food'],
        );

        expect(result).toMatchObject({
          isValid: true,
          discountAmount: 20000,
          finalPrice: 80000,
          message: 'Voucher applied successfully',
        });
      });
    });

    describe('discount calculation', () => {
      it('calculates percentage discount', async () => {
        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );
        expect(result.discountAmount).toBe(250);
        expect(result.finalPrice).toBe(750);
        expect(result.message).toBe('Voucher applied successfully');
      });

      it('calculates fixed amount discount', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            discount_type: DiscountType.FIXED_AMOUNT,
            discount_value: 100,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.discountAmount).toBe(100);
        expect(result.finalPrice).toBe(900);
      });

      it('caps fixed discount at subtotal when discount exceeds purchase', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({
            discount_type: DiscountType.FIXED_AMOUNT,
            discount_value: 5000,
          }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.discountAmount).toBe(1000);
        expect(result.finalPrice).toBe(0);
      });

      it('produces zero discount for a zero-value voucher', async () => {
        (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
          makeVoucher({ discount_value: 0 }),
        );

        const result = await service.validateAndCalculateDiscount(
          'VOU-10',
          1000,
          'user-id',
        );

        expect(result.discountAmount).toBe(0);
        expect(result.finalPrice).toBe(1000);
      });
    });

    it('handles a fully-bound, targeted, active voucher as valid', async () => {
      (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(
        makeVoucher({
          discount_type: DiscountType.PERCENTAGE,
          discount_value: 10,
          target_users: [{ core_user_id: 'user-id' }] as any,
          bindings: [{ bind_type: 'product', bind_value: 'prod-1' }] as any,
          validities: [
            {
              start_date: new Date('2020-01-01'),
              end_date: new Date('2099-12-31'),
            },
          ] as any,
        }),
      );

      const result = await service.validateAndCalculateDiscount(
        'VOU-10',
        2000,
        'user-id',
        'prod-1',
        ['groceries'],
      );

      expect(result).toEqual({
        isValid: true,
        discountAmount: 200,
        finalPrice: 1800,
        message: 'Voucher applied successfully',
      });
    });
  });

  // ---------------------------------------------------------------
  // calculateDiscount
  // ---------------------------------------------------------------
  describe('calculateDiscount', () => {
    it('throws NotFoundException when product does not exist', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.calculateDiscount(
          {
            voucher_code: 'VOU-10',
            product_id: 'prod-1',
            quantity: 1,
          },
          'user-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product is inactive', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.calculateDiscount(
          {
            voucher_code: 'VOU-10',
            product_id: 'prod-1',
            quantity: 1,
          },
          'user-id',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockManager.findOne).toHaveBeenCalledWith(ProductEntity, {
        where: { id: 'prod-1', is_active: true },
        relations: ['categories'],
      });
    });

    it('looks up only active products', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.calculateDiscount(
          {
            voucher_code: 'VOU-10',
            product_id: 'prod-1',
            quantity: 1,
          },
          'user-id',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockManager.findOne).toHaveBeenCalledWith(
        ProductEntity,
        expect.objectContaining({ where: { id: 'prod-1', is_active: true } }),
      );
    });

    it('computes subtotal from price x quantity and delegates validation', async () => {
      const product = {
        id: 'prod-1',
        price: 1000,
        is_active: true,
        categories: [{ name: 'groceries' }],
      };
      mockManager.findOne.mockResolvedValueOnce(product);
      (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(makeVoucher());

      const spy = jest.spyOn(service as any, 'validateAndCalculateDiscount');
      spy.mockResolvedValueOnce({
        isValid: true,
        discountAmount: 250,
        finalPrice: 1750,
        message: 'Voucher applied successfully',
      });

      const result = await service.calculateDiscount(
        {
          voucher_code: 'VOU-10',
          product_id: 'prod-1',
          quantity: 2,
        },
        'user-id',
      );

      expect(spy).toHaveBeenCalledWith('VOU-10', 2000, 'user-id', 'prod-1', [
        'groceries',
      ]);
      expect(result.finalPrice).toBe(1750);
      spy.mockRestore();
    });

    it('passes empty category names when product has no categories', async () => {
      const product = {
        id: 'prod-1',
        price: 500,
        is_active: true,
        categories: null,
      };
      mockManager.findOne.mockResolvedValueOnce(product);
      (voucherRepo.findOne as jest.Mock).mockResolvedValueOnce(makeVoucher());

      const spy = jest.spyOn(service as any, 'validateAndCalculateDiscount');
      spy.mockResolvedValueOnce({
        isValid: true,
        discountAmount: 0,
        finalPrice: 500,
        message: 'Voucher applied successfully',
      });

      await service.calculateDiscount(
        { voucher_code: 'VOU-10', product_id: 'prod-1', quantity: 1 },
        'user-id',
      );

      expect(spy).toHaveBeenCalledWith('VOU-10', 500, 'user-id', 'prod-1', []);
      spy.mockRestore();
    });
  });

  function mockClaim(overrides: any = {}) {
    return { id: 1, voucher: { code: 'VOU-10' }, user: mockUser, ...overrides };
  }
});
