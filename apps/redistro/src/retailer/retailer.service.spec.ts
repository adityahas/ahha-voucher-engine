import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RetailerService } from './retailer.service';

describe('RetailerService', () => {
  let service: RetailerService;
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
        RetailerService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RetailerService>(RetailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a retailer', async () => {
      const dto = { name: 'Test Retailer', phone: '1234567890' };
      const expected = { id: '1', ...dto };
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.create(dto as any);
      expect(result).toEqual(expected);
      expect(mockRepository.save).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all retailers', async () => {
      const expected = [{ id: '1', name: 'Test Retailer' }];
      mockRepository.find.mockResolvedValue(expected);

      const result = await service.findAll();
      expect(result).toEqual(expected);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a retailer by id', async () => {
      const expected = { id: '1', name: 'Test Retailer' };
      mockRepository.findOneBy.mockResolvedValue(expected);

      const result = await service.findOne('1');
      expect(result).toEqual(expected);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });
  });

  describe('update', () => {
    it('should update a retailer', async () => {
      const dto = { name: 'Updated Retailer' };
      const expected = { id: '1', ...dto };
      mockRepository.save.mockResolvedValue(expected);

      const result = await service.update('1', dto as any);
      expect(result).toEqual(expected);
      expect(mockRepository.save).toHaveBeenCalledWith({ ...dto, id: '1' });
    });
  });

  describe('remove', () => {
    it('should remove a retailer', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
