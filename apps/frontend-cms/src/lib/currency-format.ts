import type { CurrencySettings } from '../types/currency-settings';

export function formatCurrency(
  value: number | string,
  settings: CurrencySettings,
): string {
  const number = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(number)) return '-';

  try {
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency_code,
      ...settings.number_format_options,
    }).format(number);
  } catch {
    return '-';
  }
}
