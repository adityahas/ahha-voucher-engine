import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVoucherBindingDto } from './create-voucher-binding.dto';
import { CreateVoucherCategoryDto } from './create-voucher-category.dto';
import { CreateVoucherValidityDto } from './create-voucher-validity.dto';

describe('Voucher relation DTO validation', () => {
  it('accepts a valid binding', async () => {
    const dto = plainToInstance(CreateVoucherBindingDto, {
      bind_type: 'product',
      bind_value: 'prod-1',
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects an unknown binding type or empty value', async () => {
    const dto = plainToInstance(CreateVoucherBindingDto, {
      bind_type: 'unknown',
      bind_value: '',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepts a complete category', async () => {
    const dto = plainToInstance(CreateVoucherCategoryDto, {
      slug: 'food',
      name: 'Food',
      description: 'Food vouchers',
      image: 'food.png',
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects an incomplete category', async () => {
    const dto = plainToInstance(CreateVoucherCategoryDto, { slug: 'food' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepts a validity window with valid days', async () => {
    const dto = plainToInstance(CreateVoucherValidityDto, {
      type: 'daily',
      start_date: '2026-01-01T00:00:00.000Z',
      end_date: '2026-12-31T23:59:59.000Z',
      start_time: '00:00:00',
      end_time: '23:59:59',
      valid_days: ['monday', 'friday'],
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects an invalid validity type and date', async () => {
    const dto = plainToInstance(CreateVoucherValidityDto, {
      type: 'unknown',
      start_date: 'not-a-date',
      start_time: '00:00:00',
      end_time: '23:59:59',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
