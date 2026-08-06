import { describe, expect, it } from 'vitest';
import { formatCurrency } from './currency-format';
import type { CurrencySettings } from '../types/currency-settings';

const settings = (
  overrides: Partial<CurrencySettings> = {},
): CurrencySettings => ({
  currency_code: 'IDR',
  locale: 'id-ID',
  number_format_options: {},
  ...overrides,
});

describe('formatCurrency', () => {
  it.each([
    ['IDR', 'id-ID', 12500],
    ['USD', 'en-US', 1250.5],
    ['EUR', 'de-DE', 1250.5],
  ])('matches Intl for %s/%s', (currency_code, locale, value) => {
    const current = settings({ currency_code, locale });
    expect(formatCurrency(value, current)).toBe(
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency_code,
      }).format(value),
    );
  });

  it('applies decimal, grouping, and display overrides', () => {
    const current = settings({
      currency_code: 'USD',
      locale: 'en-US',
      number_format_options: {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
        currencyDisplay: 'code',
      },
    });
    expect(formatCurrency('1234.5', current)).toBe(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
        currencyDisplay: 'code',
      }).format(1234.5),
    );
  });

  it('returns a safe fallback for invalid input', () => {
    expect(formatCurrency('not-a-number', settings())).toBe('-');
  });
});
