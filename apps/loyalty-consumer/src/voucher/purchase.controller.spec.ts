import { PurchaseController } from './purchase.controller';
import { DataSource } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductEntity } from '@core/product/entities/product.entity';
import { OrderEntity } from '@core/product/entities/order.entity';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';

describe('PurchaseController', () => {
  let controller: PurchaseController;

  const mockProduct = {
    id: 'prod-id',
    name: 'Test Product',
    price: 1000,
    is_active: true,
  };

  const mockUserRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((partial: any) => ({ ...partial })),
    save: jest.fn((user: any) => Promise.resolve(user)),
  };

  const mockOrderRepo = {
    create: jest.fn((partial: any) => ({ ...partial })),
    save: jest.fn((order: any) =>
      Promise.resolve({ ...order, id: 'order-id' }),
    ),
  };

  const mockEntityManager = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
    getRepository: jest.fn().mockImplementation((entity: any) => {
      if (entity === OrderEntity) {
        return mockOrderRepo;
      }
      return mockUserRepo;
    }),
  };

  const mockVoucherService = {
    useVoucher: jest.fn(),
    validateAndCalculateDiscount: jest.fn(),
  };

  const mockTierService = {
    getMultiplierFor: jest.fn().mockResolvedValue(1),
    findLowestActiveTier: jest.fn().mockResolvedValue(null),
    findHighestTierAtOrBelow: jest.fn().mockResolvedValue(null),
  };

  const mockPointService = {
    earn: jest.fn().mockResolvedValue(0),
    recordTierChange: jest.fn(),
  };

  const mockSettingsService = {
    getLoyaltySettings: jest.fn().mockResolvedValue({
      point_base_rate: 1000,
      max_combined_discount_percent: 50,
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb: (em: any) => any) => cb(mockEntityManager)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEntityManager.findOne.mockResolvedValue(mockProduct);
    mockUserRepo.findOne.mockResolvedValue(null);
    mockTierService.getMultiplierFor.mockResolvedValue(1);
    mockTierService.findLowestActiveTier.mockResolvedValue(null);
    mockTierService.findHighestTierAtOrBelow.mockResolvedValue(null);
    controller = new PurchaseController(
      mockVoucherService as any,
      mockDataSource as unknown as DataSource,
      mockTierService as any,
      mockPointService as any,
      mockSettingsService as any,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('purchase', () => {
    const purchaseDto: CreatePurchaseDto = {
      product_id: 'prod-id',
      quantity: 1,
      voucher_code: 'VOU-10',
    };

    const mockReq = {
      user: { userId: 'user-id' },
      client: { database_name: 'tenant-db' },
    };

    it('should successfully orchestrate a purchase with a voucher', async () => {
      mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
        isValid: true,
        discountAmount: 100,
        finalPrice: 900,
      });

      // Act
      const result = await controller.purchase(mockReq, purchaseDto);

      // Assert
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        ProductEntity,
        expect.any(Object),
      );
      expect(mockVoucherService.useVoucher).toHaveBeenCalledWith(
        'user-id',
        'VOU-10',
        mockEntityManager,
      );
      expect(mockOrderRepo.save).toHaveBeenCalled();
      expect(mockPointService.earn).toHaveBeenCalledWith(
        expect.anything(),
        0.9,
        'ORDER',
        'order-id',
        mockEntityManager,
      );
      expect(result.points_earned).toBe(0.9);
      expect(result.tier).toBeNull();
    });

    it('should successfully purchase without a voucher', async () => {
      // Arrange
      const dtoNoVoucher = { ...purchaseDto, voucher_code: undefined };

      // Act
      const result = await controller.purchase(mockReq, dtoNoVoucher);

      // Assert
      expect(mockVoucherService.useVoucher).not.toHaveBeenCalled();
      expect(mockOrderRepo.save).toHaveBeenCalled();
      expect(result.points_earned).toBe(1);
      expect(result.tier).toBeNull();
    });

    it('should throw NotFoundException if product is missing', async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(controller.purchase(mockReq, purchaseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject the purchase when voucher validation fails', async () => {
      mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
        isValid: false,
        discountAmount: 0,
        finalPrice: 1000,
        message: 'Voucher quota exhausted',
      });

      await expect(controller.purchase(mockReq, purchaseDto)).rejects.toThrow(
        new BadRequestException('Voucher quota exhausted'),
      );
      expect(mockVoucherService.useVoucher).not.toHaveBeenCalled();
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });

    it('persists the complete price breakdown for a discounted purchase', async () => {
      mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
        isValid: true,
        discountAmount: 300,
        finalPrice: 1700,
      });

      await controller.purchase(mockReq, { ...purchaseDto, quantity: 2 });

      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        user_id: 'user-id',
        product_id: 'prod-id',
        quantity: 2,
        subtotal: 2000,
        discount_amount: 300,
        total_price: 1700,
        voucher_code: 'VOU-10',
      });
    });

    it('does not create an order when an inactive product is returned as unavailable', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      await expect(
        controller.purchase(mockReq, {
          ...purchaseDto,
          voucher_code: undefined,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });

    it('stacks tier discount and tier multiplier into order and points', async () => {
      const goldTier = {
        id: 'g',
        name: 'Gold',
        extra_discount_percent: 10,
      };
      const goldUser = {
        core_user_id: 'user-id',
        lifetime_points: 500,
        balance_points: 0,
        tier: goldTier,
      };
      mockUserRepo.findOne.mockResolvedValue(goldUser);
      mockTierService.getMultiplierFor.mockResolvedValue(2);

      const result = await controller.purchase(mockReq, {
        ...purchaseDto,
        voucher_code: undefined,
      });

      expect(mockOrderRepo.save).toHaveBeenCalledWith({
        user_id: 'user-id',
        product_id: 'prod-id',
        quantity: 1,
        subtotal: 1000,
        discount_amount: 100,
        total_price: 900,
        voucher_code: null,
      });
      expect(mockPointService.earn).toHaveBeenCalledWith(
        goldUser,
        1.8,
        'ORDER',
        'order-id',
        mockEntityManager,
      );
      expect(result.points_earned).toBe(1.8);
      expect(result.tier).toEqual({ id: 'g', name: 'Gold' });
    });

    it('caps the combined voucher + tier discount at max_combined_discount_percent', async () => {
      const goldTier = {
        id: 'g',
        name: 'Gold',
        extra_discount_percent: 10,
      };
      const goldUser = {
        core_user_id: 'user-id',
        lifetime_points: 500,
        balance_points: 0,
        tier: goldTier,
      };
      mockUserRepo.findOne.mockResolvedValue(goldUser);
      mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
        isValid: true,
        discountAmount: 450,
        finalPrice: 550,
      });

      const result = await controller.purchase(mockReq, purchaseDto);

      expect(mockOrderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1000,
          discount_amount: 500,
          total_price: 500,
        }),
      );
      expect(result.discount_amount).toBe(500);
      expect(result.total_price).toBe(500);
      expect(mockPointService.earn).toHaveBeenCalledWith(
        goldUser,
        0.5,
        'ORDER',
        'order-id',
        mockEntityManager,
      );
      expect(result.points_earned).toBe(0.5);
    });

    it('levels the user up when earned points cross the next tier threshold', async () => {
      const bronzeTier = {
        id: 'b',
        name: 'Bronze',
        extra_discount_percent: 0,
      };
      const silverTier = {
        id: 's',
        name: 'Silver',
        min_points: 1000,
      };
      const bronzeUser = {
        core_user_id: 'user-id',
        lifetime_points: 400,
        balance_points: 400,
        tier: bronzeTier,
      };
      mockUserRepo.findOne.mockResolvedValue(bronzeUser);
      mockTierService.findHighestTierAtOrBelow.mockResolvedValue(silverTier);

      const result = await controller.purchase(mockReq, {
        ...purchaseDto,
        voucher_code: undefined,
      });

      const savedUser =
        mockUserRepo.save.mock.calls[
          mockUserRepo.save.mock.calls.length - 1
        ][0];
      expect(mockUserRepo.save).toHaveBeenCalledTimes(1);
      expect(savedUser.tier).toEqual(silverTier);
      expect(mockPointService.recordTierChange).toHaveBeenCalledWith(
        bronzeUser,
        bronzeTier,
        silverTier,
        TierChangeReason.POINTS_THRESHOLD,
        mockEntityManager,
      );
      expect(result.points_earned).toBe(1);
    });
  });
});
