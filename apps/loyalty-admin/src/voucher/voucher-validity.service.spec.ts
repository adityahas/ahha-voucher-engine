import { Test, TestingModule } from '@nestjs/testing';
import { VoucherValidityService } from './voucher-validity.service';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  VoucherValidityEntity,
  VoucherValidityType,
} from '@core/loyalty/voucher/entities/voucher-validity.entity';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { CreateVoucherValidityDto } from './dto/create-voucher-validity.dto';

describe('VoucherValidityService', () => {
  let service: VoucherValidityService;
  let mockValidityRepository: jest.Mocked<any>;
  let mockVoucherRepository: jest.Mocked<any>;

  const mockVoucherId = 'VOUCHER123';
  const mockValidityId = 1;

  const mockVoucher = {
    id: 1,
    code: mockVoucherId,
  } as unknown as VoucherEntity;

  const mockValidity = {
    id: mockValidityId,
    voucher: mockVoucher,
    type: VoucherValidityType.DAILY,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    start_time: new Date('1970-01-01T08:00:00Z'),
    end_time: new Date('1970-01-01T17:00:00Z'),
  } as unknown as VoucherValidityEntity;

  beforeEach(async () => {
    // Reset implementations
    mockValidityRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    mockVoucherRepository = {
      findOne: jest.fn(),
    };

    const mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === VoucherValidityEntity) return mockValidityRepository;
        if (entity === VoucherEntity) return mockVoucherRepository;
        return {};
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherValidityService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<VoucherValidityService>(VoucherValidityService);

    // Overwrite the initialized repositories with our mocks for assertions
    (service as any).validityRepository = mockValidityRepository;
    (service as any).voucherRepository = mockVoucherRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    const createDto: CreateVoucherValidityDto = {
      type: VoucherValidityType.DAILY,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      start_time: '08:00:00',
      end_time: '17:00:00',
    };

    it('should successfully create a validity constraint', async () => {
      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);
      mockValidityRepository.create.mockReturnValue(mockValidity);
      mockValidityRepository.save.mockResolvedValue(mockValidity);

      const result = await service.create(mockVoucherId, createDto);

      expect(mockVoucherRepository.findOne).toHaveBeenCalledWith({
        where: { code: mockVoucherId },
      });
      expect(mockValidityRepository.create).toHaveBeenCalledWith({
        ...createDto,
        voucher: mockVoucher,
      });
      expect(mockValidityRepository.save).toHaveBeenCalledWith(mockValidity);
      expect(result).toEqual(mockValidity);
    });

    it('should throw NotFoundException if voucher is not found', async () => {
      mockVoucherRepository.findOne.mockResolvedValue(null);

      await expect(service.create(mockVoucherId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockValidityRepository.create).not.toHaveBeenCalled();
      expect(mockValidityRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should return an array of validities for a voucher', async () => {
      mockVoucherRepository.findOne.mockResolvedValue(mockVoucher);
      mockValidityRepository.find.mockResolvedValue([mockValidity]);

      const result = await service.findAll(mockVoucherId);

      expect(mockVoucherRepository.findOne).toHaveBeenCalledWith({
        where: { code: mockVoucherId },
      });
      expect(mockValidityRepository.find).toHaveBeenCalledWith({
        where: { voucher: { code: mockVoucherId } },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual([mockValidity]);
    });

    it('should throw NotFoundException if voucher is not found', async () => {
      mockVoucherRepository.findOne.mockResolvedValue(null);

      await expect(service.findAll(mockVoucherId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockValidityRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a single validity', async () => {
      mockValidityRepository.findOne.mockResolvedValue(mockValidity);

      const result = await service.findOne(mockVoucherId, mockValidityId);

      expect(mockValidityRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockValidityId, voucher: { code: mockVoucherId } },
      });
      expect(result).toEqual(mockValidity);
    });

    it('should throw NotFoundException if validity is not found', async () => {
      mockValidityRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(mockVoucherId, mockValidityId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update and return a validity', async () => {
      const updateDto = { type: VoucherValidityType.ONE_TIME };
      mockValidityRepository.findOne.mockResolvedValue(mockValidity);

      const updatedEntity = { ...mockValidity, ...updateDto };
      mockValidityRepository.save.mockResolvedValue(updatedEntity);

      const result = await service.update(
        mockVoucherId,
        mockValidityId,
        updateDto,
      );

      expect(mockValidityRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockValidityId, voucher: { code: mockVoucherId } },
      });
      expect(mockValidityRepository.save).toHaveBeenCalled();
      expect(result.type).toEqual(VoucherValidityType.ONE_TIME);
    });
  });

  describe('remove()', () => {
    it('should remove a validity', async () => {
      mockValidityRepository.findOne.mockResolvedValue(mockValidity);
      mockValidityRepository.remove.mockResolvedValue(mockValidity);

      await service.remove(mockVoucherId, mockValidityId);

      expect(mockValidityRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockValidityId, voucher: { code: mockVoucherId } },
      });
      expect(mockValidityRepository.remove).toHaveBeenCalledWith(mockValidity);
    });
  });
});
