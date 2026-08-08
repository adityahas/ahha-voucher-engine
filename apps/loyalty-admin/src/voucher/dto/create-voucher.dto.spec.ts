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
});
