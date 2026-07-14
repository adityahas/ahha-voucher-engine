import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { WarehouseService } from './warehouse.service';

describe('WarehouseService', () => {
  let service: WarehouseService;
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
        WarehouseService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a warehouse', async () => {
      const dto = { name: 'Test Warehouse', location: 'Location A' };
      const expected = { id: '1', ...dto };
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto as any);
      expect(result).toEqual(expected);
      expect(mockRepository.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all warehouses', async () => {
      const expected = [{ id: '1', name: 'Test Warehouse' }];
      mockRepository.find.mockResolvedValue(expected);

      const result = await service.findAll();
      expect(result).toEqual(expected);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a warehouse by id', async () => {
      const expected = { id: '1', name: 'Test Warehouse' };
      mockRepository.findOneBy.mockResolvedValue(expected);

      const result = await service.findOne('1');
      expect(result).toEqual(expected);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('update', () => {
    it('should update a warehouse', async () => {
      const dto = { name: 'Updated Warehouse' };
      const expected = { id: '1', ...dto };
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.update('1', dto as any);
      expect(result).toEqual(expected);
      expect(mockRepository.save).toHaveBeenCalledWith({ ...dto, id: '1' });
    });
  });

  describe('remove', () => {
    it('should remove a warehouse', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
