import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { OrderService } from './order.service';
import {
  OrderEntity,
  OrderPaymentStatus,
  OrderStatus,
} from './entities/order.entity';
import { NotFoundException } from '@nestjs/common';

describe('OrderService', () => {
  let service: OrderService;
  let repository: Repository<OrderEntity>;

  const mockOrder = {
    id: 'test-id',
    user_id: 'user-id',
    product_id: 'product-id',
    quantity: 1,
    total_price: 100,
    status: OrderStatus.PENDING,
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockOrder),
    save: jest.fn().mockReturnValue(mockOrder),
    findOne: jest.fn().mockResolvedValue(mockOrder),
    find: jest.fn().mockResolvedValue([mockOrder]),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = mockRepository as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('accepts the hybrid payment breakdown and only supported payment statuses', () => {
    const order = new OrderEntity();
    Object.assign(order, {
      subtotal: 100,
      voucher_discount_amount: 10,
      points_used: 20,
      point_discount_amount: 5,
      cash_amount: 85,
      payment_status: OrderPaymentStatus.PAID,
      voucher_code: 'VOUCHER-1',
    });

    expect(order).toMatchObject({
      subtotal: 100,
      voucher_discount_amount: 10,
      points_used: 20,
      point_discount_amount: 5,
      cash_amount: 85,
      payment_status: OrderPaymentStatus.PAID,
      voucher_code: 'VOUCHER-1',
    });
    expect(Object.values(OrderPaymentStatus)).toEqual([
      'PAID',
      'PENDING_PAYMENT',
    ]);
  });

  describe('create', () => {
    it('should successfully create and save an order', async () => {
      // Arrange
      const createDto = {
        user_id: 'u1',
        product_id: 'p1',
        quantity: 1,
        total_price: 100,
      };

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findOne', () => {
    it('should return an order if it exists', async () => {
      // Act
      const result = await service.findOne('test-id');

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update and save the order status', async () => {
      // Act
      const result = await service.updateStatus(
        'test-id',
        OrderStatus.COMPLETED,
      );

      // Assert
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.COMPLETED);
    });
  });

  describe('findByUserId', () => {
    it('should return orders for a specific user', async () => {
      // Act
      const result = await service.findByUserId('user-id');

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-id' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual([mockOrder]);
    });
  });
});
