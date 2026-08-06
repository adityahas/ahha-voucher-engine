import { describe, expect, it } from 'vitest';
import { formatCurrency } from './currency-format';
import { DEFAULT_CURRENCY_SETTINGS } from '../types/currency-settings';

describe('formatCurrency', () => {
  it('formats decimal API values with tenant settings', () => {
    const result = formatCurrency('1234.5', {
      ...DEFAULT_CURRENCY_SETTINGS,
      currency_code: 'USD',
      locale: 'en-US',
    });

    expect(result).toBe('$1,234.50');
  });

  it('applies persisted Intl overrides without changing the value', () => {
    expect(
      formatCurrency(1234.5, {
        ...DEFAULT_CURRENCY_SETTINGS,
        currency_code: 'EUR',
        locale: 'de-DE',
        number_format_options: { minimumFractionDigits: 0 },
      }),
    ).toContain('1.234,5');
  });
});
