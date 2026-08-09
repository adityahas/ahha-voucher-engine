import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CalculateDiscountDto } from './calculate-discount.dto';
import { CreatePurchaseDto } from './create-purchase.dto';

describe('Consumer voucher DTO validation', () => {
  it('accepts a valid discount calculation request', async () => {
    const dto = plainToInstance(CalculateDiscountDto, {
      voucher_code: 'VOU-1',
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 2,
    });
    expect(await validate(dto)).toEqual([]);
  });

  it.each([
    [{ voucher_code: '', product_id: 'bad', quantity: 0 }],
    [{ voucher_code: 'VOU-1', product_id: 'bad', quantity: 1 }],
    [
      {
        voucher_code: 'VOU-1',
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0,
      },
    ],
  ])('rejects invalid discount request: %j', async (payload) => {
    const errors = await validate(
      plainToInstance(CalculateDiscountDto, payload),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a purchase without a voucher', async () => {
    const dto = plainToInstance(CreatePurchaseDto, {
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 1,
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('accepts a purchase with a voucher', async () => {
    const dto = plainToInstance(CreatePurchaseDto, {
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 1,
      voucher_code: 'VOU-1',
    });
    expect(await validate(dto)).toEqual([]);
  });

  it.each([
    [{ product_id: 'bad', quantity: 1 }],
    [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: 0 }],
    [{ product_id: '550e8400-e29b-41d4-a716-446655440000', quantity: -1 }],
  ])('rejects invalid purchase: %j', async (payload) => {
    const errors = await validate(plainToInstance(CreatePurchaseDto, payload));
    expect(errors.length).toBeGreaterThan(0);
  });
});
