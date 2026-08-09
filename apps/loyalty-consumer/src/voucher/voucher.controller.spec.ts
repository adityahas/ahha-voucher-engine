import { Test, TestingModule } from '@nestjs/testing';
import { VoucherController } from './voucher.controller';

describe('Consumer VoucherController', () => {
  let controller: VoucherController;
  let service: any;

  beforeEach(async () => {
    service = {
      findEligibleVouchers: jest.fn(),
      getClaimedVouchers: jest.fn(),
      claimVoucher: jest.fn(),
      calculateDiscount: jest.fn(),
      useVoucher: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoucherController],
      providers: [{ provide: 'VOUCHER_SERVICE', useValue: service }],
    }).compile();

    controller = module.get(VoucherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('injects the authenticated user into eligible-voucher searches', async () => {
    const dto: any = { bindings: [] };
    service.findEligibleVouchers.mockResolvedValue([]);

    await controller.findEligibleVouchers(
      { user: { userId: 'user-1' } } as any,
      dto,
    );

    expect(dto.user_id).toBe('user-1');
    expect(service.findEligibleVouchers).toHaveBeenCalledWith(dto);
  });

  it('gets claimed vouchers for the authenticated user', async () => {
    const pagination: any = { page: 1, size: 10 };
    const response = { data: [], pagination };
    service.getClaimedVouchers.mockResolvedValue(response);

    await expect(
      controller.getClaimedVouchers(
        { user: { userId: 'user-1' } } as any,
        pagination,
      ),
    ).resolves.toBe(response);
    expect(service.getClaimedVouchers).toHaveBeenCalledWith(
      'user-1',
      pagination,
    );
  });

  it('claims a voucher for the authenticated user', async () => {
    service.claimVoucher.mockResolvedValue({ success: true });

    await controller.claimVoucher('VOU-1', {
      user: { userId: 'user-1' },
    } as any);

    expect(service.claimVoucher).toHaveBeenCalledWith('user-1', 'VOU-1');
  });

  it('calculates a discount for the authenticated user', async () => {
    const dto: any = {
      voucher_code: 'VOU-1',
      product_id: 'prod-1',
      quantity: 2,
    };
    service.calculateDiscount.mockResolvedValue({ isValid: true });

    await controller.calculateDiscount(dto, {
      user: { userId: 'user-1' },
    } as any);

    expect(service.calculateDiscount).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('redeems a voucher for the authenticated user', async () => {
    service.useVoucher.mockResolvedValue({ id: 1 });

    await controller.redeemVoucher('VOU-1', {
      user: { userId: 'user-1' },
    } as any);

    expect(service.useVoucher).toHaveBeenCalledWith('user-1', 'VOU-1');
  });
});
