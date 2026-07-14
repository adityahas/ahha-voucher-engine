import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseController } from './purchase.controller';
import { DataSource } from 'typeorm';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { NotFoundException } from '@nestjs/common';
import { ProductEntity } from '@core/product/entities/product.entity';

describe('PurchaseController', () => {
  let controller: PurchaseController;
  let dataSource: DataSource;

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

  const mockEntityManager = {
    findOne: jest.fn().mockResolvedValue(mockProduct),
  };

  const mockVoucherService = {
    useVoucher: jest.fn(),
  };

  const mockOrderService = {
    create: jest.fn().mockResolvedValue(mockOrder),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseController],
      providers: [
        {
          provide: 'VOUCHER_SERVICE',
          useValue: mockVoucherService,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: 'LOYALTY_CONSUMER_CONNECTION',
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<PurchaseController>(PurchaseController);
    dataSource = module.get<DataSource>('LOYALTY_CONSUMER_CONNECTION');
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
      user: { core_user_id: 'user-id' },
    };

    it('should successfully orchestrate a purchase with a voucher', async () => {
      // Act
      const result = await controller.purchase(mockReq, purchaseDto);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
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
      expect(result).toEqual(mockOrder);
    });

    it('should successfully purchase without a voucher', async () => {
      // Arrange
      const dtoNoVoucher = { ...purchaseDto, voucher_code: undefined };

      // Act
      const result = await controller.purchase(mockReq, dtoNoVoucher);

      // Assert
      expect(mockVoucherService.useVoucher).not.toHaveBeenCalled();
      expect(mockOrderService.create).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if product is missing', async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(controller.purchase(mockReq, purchaseDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
