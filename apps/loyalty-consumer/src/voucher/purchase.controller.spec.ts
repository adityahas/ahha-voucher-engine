import { PurchaseController } from './purchase.controller';
import { DataSource } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductEntity } from '@core/product/entities/product.entity';

describe('PurchaseController', () => {
  let controller: PurchaseController;

  const mockProduct = {
    id: 'prod-id',
    name: 'Test Product',
    price: 1000,
    is_active: true,
  };

  const mockOrder = {
    id: 'order-id',
    total_price: 1000,
  };

  const mockUserRepo = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((partial: any) => ({ ...partial })),
    save: jest.fn((user: any) => Promise.resolve(user)),
  };

  const mockEntityManager = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
    getRepository: jest.fn().mockReturnValue(mockUserRepo),
  };

  const mockVoucherService = {
    useVoucher: jest.fn(),
    validateAndCalculateDiscount: jest.fn(),
  };

  const mockOrderService = {
    create: jest.fn().mockResolvedValue(mockOrder),
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
    controller = new PurchaseController(
      mockVoucherService as any,
      mockOrderService as any,
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
      expect(mockOrderService.create).toHaveBeenCalled();
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
      expect(mockOrderService.create).toHaveBeenCalled();
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
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });

    it('persists the complete price breakdown for a discounted purchase', async () => {
      mockVoucherService.validateAndCalculateDiscount.mockResolvedValue({
        isValid: true,
        discountAmount: 300,
        finalPrice: 1700,
      });

      await controller.purchase(mockReq, { ...purchaseDto, quantity: 2 });

      expect(mockOrderService.create).toHaveBeenCalledWith({
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
      expect(mockOrderService.create).not.toHaveBeenCalled();
    });
  });
});
