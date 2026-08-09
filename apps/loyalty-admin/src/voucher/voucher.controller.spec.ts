import { Test, TestingModule } from '@nestjs/testing';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';
import { Reflector } from '@nestjs/core';
import { AclService } from '@core/auth/acl.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

describe('VoucherController', () => {
  let controller: VoucherController;
  let service: VoucherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoucherController],
      providers: [
        {
          provide: 'VOUCHER_SERVICE',
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        Reflector,
        AclService,
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AclGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VoucherController>(VoucherController);
    service = module.get<VoucherService>('VOUCHER_SERVICE');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a voucher', async () => {
      const createVoucherDto: CreateVoucherDto = {
        code: 'TEST1234',
        quota: 100,
        categories: [],
        allow_combine_categories: [],
        validities: [],
        bindings: [],
        target_users: [],
      };
      const result = { id: '1', ...createVoucherDto };
      jest.spyOn(service, 'create').mockResolvedValue(result as any);

      expect(await controller.create(createVoucherDto)).toEqual(
        expect.objectContaining(result),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of vouchers', async () => {
      const result = ['test-voucher-1', 'test-voucher-2'];
      jest.spyOn(service, 'findAll').mockResolvedValue({
        code: 'SUCCESS',
        message: 'ok',
        data: result,
        pagination: { page: 0, size: 10, total: 2 },
      } as any);

      const response = await controller.findAll({
        page: 0,
        size: 10,
        search: '',
        sort: 'code',
        order: 'ASC',
      });
      expect(response).toEqual(expect.objectContaining({ data: result }));
    });
  });

  describe('findOne', () => {
    it('should return a single voucher', async () => {
      const result = { id: '1', code: 'TEST1234', quota: 100 };
      jest.spyOn(service, 'findOne').mockResolvedValue(result as any);

      expect(await controller.findOne('1')).toEqual(
        expect.objectContaining(result),
      );
    });
  });

  describe('update', () => {
    it('should update a voucher', async () => {
      const updateVoucherDto: UpdateVoucherDto = { code: 'UPDATED123' };
      const result = { id: '1', code: 'UPDATED123', quota: 100 };
      jest.spyOn(service, 'update').mockResolvedValue(result as any);

      expect(await controller.update('1', updateVoucherDto)).toEqual(
        expect.objectContaining(result),
      );
    });
  });

  describe('remove', () => {
    it('should remove a voucher', async () => {
      const result = { affected: 1 };
      jest.spyOn(service, 'remove').mockResolvedValue(result as any);

      expect(await controller.remove('1')).toBe(result);
    });
  });
});
