import { Test, TestingModule } from '@nestjs/testing';
import { VoucherBindingService } from './voucher-binding.service';
import { DataSource, Repository } from 'typeorm';
import { VoucherBindingEntity } from '@core/loyalty/voucher/entities/voucher-binding.entity';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { NotFoundException } from '@nestjs/common';

describe('VoucherBindingService', () => {
  let service: VoucherBindingService;
  let repository: jest.Mocked<Repository<VoucherBindingEntity>>;
  let voucherRepository: jest.Mocked<Repository<VoucherEntity>>;

  const mockVoucher = { id: 1, code: 'VOUCHER101' } as unknown as VoucherEntity;
  const mockBinding = {
    id: 1,
    bind_type: 'role',
    bind_value: 'admin',
  } as unknown as VoucherBindingEntity;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;
    voucherRepository = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherBindingService,
        {
          provide: DataSource,
          useValue: {
            getRepository: (entity) => {
              if (entity === VoucherBindingEntity) return repository;
              if (entity === VoucherEntity) return voucherRepository;
            },
          },
        },
      ],
    }).compile();

    service = module.get<VoucherBindingService>(VoucherBindingService);
    // Explicitly set because of service constructor logic
    (service as any).repository = repository;
    (service as any).voucherRepository = voucherRepository;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a binding', async () => {
      voucherRepository.findOne.mockResolvedValue(mockVoucher);
      repository.create.mockReturnValue(mockBinding);
      repository.save.mockResolvedValue(mockBinding);

      const result = await service.create('VOUCHER101', {
        bind_type: 'role',
        bind_value: 'admin',
      } as any);

      expect(result).toEqual(mockBinding);
      expect(voucherRepository.findOne).toHaveBeenCalledWith({
        where: [{ code: 'VOUCHER101' }],
      });
    });

    it('should throw NotFoundException if voucher not found', async () => {
      voucherRepository.findOne.mockResolvedValue(null);

      await expect(service.create('INVALID', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all bindings for a voucher', async () => {
      repository.find.mockResolvedValue([mockBinding]);

      const result = await service.findAll('VOUCHER101');

      expect(result).toEqual([mockBinding]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { voucher: { code: 'VOUCHER101' } },
      });
    });
  });

  describe('findOne', () => {
    it('should return a binding', async () => {
      repository.findOne.mockResolvedValue(mockBinding);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBinding);
    });

    it('should throw NotFoundException if binding not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a binding', async () => {
      repository.findOne.mockResolvedValue({ ...mockBinding });
      repository.save.mockImplementation((b) => Promise.resolve(b as any));

      const result = await service.update(1, { bind_value: 'user' } as any);

      expect(result.bind_value).toBe('user');
    });
  });

  describe('remove', () => {
    it('should remove a binding', async () => {
      repository.findOne.mockResolvedValue(mockBinding);
      repository.remove.mockResolvedValue(undefined as any);

      await service.remove('VOUCHER101', 1);

      expect(repository.remove).toHaveBeenCalledWith(mockBinding);
    });
  });
});
