import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RedistroService } from './redistro.service';

describe('RedistroService', () => {
  let service: RedistroService;
  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataSource.getRepository.mockReturnValue(mockRepository);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedistroService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RedistroService>(RedistroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('InventoryStock', () => {
    it('should create inventory stock', async () => {
      const dto = { product_id: 'p1', warehouse_id: 'w1', quantity: 10 };
      const expected = { id: '1', ...dto };
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.createInventoryStock(dto as any);
      expect(result).toEqual(expected);
      expect(mockRepository.save).toHaveBeenCalledWith(dto);
    });

    it('should find all inventory stocks', async () => {
      mockRepository.find.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAllInventoryStocks();
      expect(result).toHaveLength(1);
    });

    it('should find one inventory stock', async () => {
      mockRepository.findOneBy.mockResolvedValue({ id: '1' });
      const result = await service.findOneInventoryStock('1');
      expect(result).toEqual({ id: '1' });
    });

    it('should remove inventory stock', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      await service.removeInventoryStock('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('SalesOrder', () => {
    it('should create sales order', async () => {
      const dto = { retailer_id: 'r1', total_amount: 100, status: 'pending' };
      mockRepository.save.mockResolvedValue({ id: '1', ...dto });
      const result = await service.createSalesOrder(dto as any);
      expect(result).toBeDefined();
    });

    it('should find all sales orders', async () => {
      mockRepository.find.mockResolvedValue([{ id: '1' }]);
      const result = await service.findAllSalesOrders();
      expect(result).toHaveLength(1);
    });
  });
});
