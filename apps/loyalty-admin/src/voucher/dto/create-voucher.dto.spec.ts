import { plainToClass } from '@nestjs/class-transformer';
import { validate } from '@nestjs/class-validator';
import { CreateVoucherDto } from './create-voucher.dto';

describe('CreateVoucherDto validation', () => {
  const minimalPayload = {
    voucher_type: 'CLAIMABLE',
    code: 'PROMO-2026-01-01',
    description: '',
    quota: 100,
    image: '',
    discount_type: 'PERCENTAGE',
    discount_value: 90,
  };

  it('accepts a payload with no validities and no bindings', async () => {
    const dto = plainToClass(CreateVoucherDto, minimalPayload);
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('accepts empty arrays for categories and allow_combine_categories', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      categories: [],
      allow_combine_categories: [],
      validities: [],
      bindings: [],
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects a missing code', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      code: '',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects invalid voucher and discount enums', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      voucher_type: 'INVALID',
      discount_type: 'INVALID',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects invalid claim_period enum values', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      claim_period: 'INVALID',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepts a valid claim_period enum value', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      claim_period: 'DAILY',
    });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });

  it('rejects non-integer quota and non-numeric discount values', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      quota: 1.5,
      discount_value: 'ten',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejects invalid target-user UUIDs', async () => {
    const dto = plainToClass(CreateVoucherDto, {
      ...minimalPayload,
      target_users: ['not-a-uuid'],
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
