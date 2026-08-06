import type { CurrencySettings } from '../types/currency-settings';

export function formatCurrency(
  value: number | string,
  settings: CurrencySettings,
): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(amount)) return '-';

  try {
    return new Intl.NumberFormat(settings.locale, {
      style: 'currency',
      currency: settings.currency_code,
      ...settings.number_format_options,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  }
}
