import { PurchaseController } from './purchase.controller';
import { DataSource } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductEntity } from '@core/product/entities/product.entity';
import {
  OrderEntity,
  OrderPaymentStatus,
} from '@core/product/entities/order.entity';
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
    grantLevelUpVoucher: jest.fn(),
  };

  const mockPointService = {
    earn: jest.fn().mockResolvedValue(0),
    spend: jest.fn().mockResolvedValue(0),
    recordTierChange: jest.fn(),
  };

  const mockSettingsService = {
    getLoyaltySettings: jest.fn().mockResolvedValue({
      point_base_rate: 1000,
      max_combined_discount_percent: 50,
      point_to_currency_rate: 1,
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
    mockTierService.grantLevelUpVoucher.mockResolvedValue({
      granted: true,
      voucherCode: 'GOLD2030',
      message: 'granted',
    });
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
        voucher_discount_amount: 300,
        points_used: 0,
        point_discount_amount: 0,
        cash_amount: 1700,
        total_price: 1700,
        payment_status: OrderPaymentStatus.PENDING_PAYMENT,
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
        voucher_discount_amount: 100,
        points_used: 0,
        point_discount_amount: 0,
        cash_amount: 900,
        total_price: 900,
        payment_status: OrderPaymentStatus.PENDING_PAYMENT,
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
        lifetime_points: 999,
        balance_points: 999,
        tier: bronzeTier,
      };
      mockUserRepo.findOne.mockResolvedValue(bronzeUser);
      mockPointService.earn.mockImplementation((user: any) => {
        user.lifetime_points = (Number(user.lifetime_points) || 0) + 1;
        return Promise.resolve(0);
      });
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
      expect(result.tier).toEqual({ id: 's', name: 'Silver' });
    });

    it('grants the tier level-up voucher and returns level_up_grant', async () => {
      mockTierService.findHighestTierAtOrBelow.mockResolvedValue({
        id: 'gold',
        name: 'Gold',
        level_up_voucher_code: 'GOLD2030',
      });
      mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
        isValid: true,
        discountAmount: 0,
        finalPrice: 1000,
      });

      const result = await controller.purchase(mockReq, {
        product_id: 'prod-id',
        quantity: 1,
      });

      expect(mockPointService.recordTierChange).toHaveBeenCalledWith(
        expect.anything(),
        null,
        expect.objectContaining({ id: 'gold' }),
        TierChangeReason.POINTS_THRESHOLD,
        mockEntityManager,
      );
      expect(mockTierService.grantLevelUpVoucher).toHaveBeenCalled();
      expect(result.level_up_grant).toEqual({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      });
    });

    it('returns level_up_grant: null when no level-up occurs', async () => {
      const result = await controller.purchase(mockReq, {
        product_id: 'prod-id',
        quantity: 1,
      });
      expect(mockTierService.grantLevelUpVoucher).not.toHaveBeenCalled();
      expect(result.level_up_grant).toBeNull();
    });

    // ---------------------------------------------------------------
    // Hybrid points payment
    // ---------------------------------------------------------------
    describe('hybrid points payment', () => {
      const userWithBalance = {
        core_user_id: 'user-id',
        lifetime_points: 5000,
        balance_points: 2000,
        tier: null,
      };

      beforeEach(() => {
        mockUserRepo.findOne.mockResolvedValue(userWithBalance);
      });

      it('creates a PAID order when points fully cover the price', async () => {
        const result = await controller.purchase(mockReq, {
          product_id: 'prod-id',
          quantity: 1,
          points_to_use: 1000,
        });

        expect(mockOrderRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            subtotal: 1000,
            discount_amount: 0,
            voucher_discount_amount: 0,
            points_used: 1000,
            point_discount_amount: 1000,
            cash_amount: 0,
            total_price: 0,
            payment_status: OrderPaymentStatus.PAID,
            voucher_code: null,
          }),
        );
        expect(mockPointService.spend).toHaveBeenCalledWith(
          userWithBalance,
          1000,
          'PRODUCT_PURCHASE',
          'order-id',
          mockEntityManager,
        );
        expect(result.payment_status).toBe(OrderPaymentStatus.PAID);
        expect(result.cash_amount).toBe(0);
        expect(result.points_earned).toBe(0);
      });

      it('creates a PENDING_PAYMENT order for a hybrid cash remainder', async () => {
        const result = await controller.purchase(mockReq, {
          product_id: 'prod-id',
          quantity: 1,
          points_to_use: 400,
        });

        expect(mockOrderRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            points_used: 400,
            point_discount_amount: 400,
            cash_amount: 600,
            total_price: 600,
            payment_status: OrderPaymentStatus.PENDING_PAYMENT,
          }),
        );
        expect(mockPointService.spend).toHaveBeenCalledWith(
          userWithBalance,
          400,
          'PRODUCT_PURCHASE',
          'order-id',
          mockEntityManager,
        );
        expect(result.points_earned).toBe(0.6);
      });

      it('combines voucher and points in the order breakdown', async () => {
        mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
          isValid: true,
          discountAmount: 250,
          finalPrice: 750,
        });

        const result = await controller.purchase(mockReq, {
          product_id: 'prod-id',
          quantity: 1,
          voucher_code: 'VOU-10',
          points_to_use: 750,
        });

        expect(mockOrderRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            subtotal: 1000,
            discount_amount: 250,
            voucher_discount_amount: 250,
            points_used: 750,
            point_discount_amount: 750,
            cash_amount: 0,
            payment_status: OrderPaymentStatus.PAID,
          }),
        );
        expect(mockVoucherService.useVoucher).toHaveBeenCalledWith(
          'user-id',
          'VOU-10',
          mockEntityManager,
        );
        expect(mockPointService.spend).toHaveBeenCalledWith(
          userWithBalance,
          750,
          'PRODUCT_PURCHASE',
          'order-id',
          mockEntityManager,
        );
        expect(result.payment_status).toBe(OrderPaymentStatus.PAID);
      });

      it('rejects points above the user balance', async () => {
        await expect(
          controller.purchase(mockReq, {
            product_id: 'prod-id',
            quantity: 1,
            points_to_use: 3000,
          }),
        ).rejects.toThrow(
          new BadRequestException('points_to_use exceeds point balance'),
        );
        expect(mockOrderRepo.save).not.toHaveBeenCalled();
        expect(mockPointService.spend).not.toHaveBeenCalled();
      });

      it('rejects points whose value exceeds the post-discount subtotal', async () => {
        mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
          isValid: true,
          discountAmount: 100,
          finalPrice: 900,
        });

        await expect(
          controller.purchase(mockReq, {
            product_id: 'prod-id',
            quantity: 1,
            voucher_code: 'VOU-10',
            points_to_use: 1000,
          }),
        ).rejects.toThrow(
          new BadRequestException(
            'points_to_use exceeds the post-voucher subtotal',
          ),
        );
        expect(mockOrderRepo.save).not.toHaveBeenCalled();
        expect(mockVoucherService.useVoucher).toHaveBeenCalled();
        expect(mockPointService.spend).not.toHaveBeenCalled();
      });

      it('rejects fractional points', async () => {
        await expect(
          controller.purchase(mockReq, {
            product_id: 'prod-id',
            quantity: 1,
            points_to_use: 12.5,
          }),
        ).rejects.toThrow(BadRequestException);
        expect(mockOrderRepo.save).not.toHaveBeenCalled();
      });

      it('aborts the purchase when spending points fails', async () => {
        mockPointService.spend.mockRejectedValueOnce(
          new BadRequestException('Insufficient points'),
        );

        await expect(
          controller.purchase(mockReq, {
            product_id: 'prod-id',
            quantity: 1,
            points_to_use: 400,
          }),
        ).rejects.toThrow(new BadRequestException('Insufficient points'));
        expect(mockPointService.earn).not.toHaveBeenCalled();
      });

      it('honours a custom tenant point rate', async () => {
        mockSettingsService.getLoyaltySettings.mockResolvedValue({
          point_base_rate: 1000,
          max_combined_discount_percent: 50,
          point_to_currency_rate: 2,
        });

        const result = await controller.purchase(mockReq, {
          product_id: 'prod-id',
          quantity: 1,
          points_to_use: 400,
        });

        expect(mockOrderRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            point_discount_amount: 800,
            cash_amount: 200,
            total_price: 200,
            payment_status: OrderPaymentStatus.PENDING_PAYMENT,
          }),
        );
        expect(result.cash_amount).toBe(200);
      });
    });
  });
});
