import { describe, expect, it } from 'vitest';
import { formatVoucherDiscount } from './voucher-discount-format';
import { DEFAULT_CURRENCY_SETTINGS } from '../types/currency-settings';

describe('formatVoucherDiscount', () => {
  it('formats fixed discounts with tenant currency settings', () => {
    expect(
      formatVoucherDiscount('FIXED_AMOUNT', 25000, DEFAULT_CURRENCY_SETTINGS),
    ).toMatch(/Rp.*25\.000/);
  });

  it('formats percentage discounts regardless of API casing', () => {
    expect(
      formatVoucherDiscount('percentage', 10, DEFAULT_CURRENCY_SETTINGS),
    ).toBe('10% off');
  });
});
