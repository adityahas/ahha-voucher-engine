import type { CurrencySettings } from '../types/currency-settings';
import { formatCurrency } from './currency-format';

export function formatVoucherDiscount(
  discountType: string,
  discountValue: number,
  settings: CurrencySettings,
): string {
  const normalizedType = discountType.trim().toLowerCase();

  if (normalizedType === 'percentage') {
    return `${discountValue}% off`;
  }

  if (normalizedType === 'fixed' || normalizedType === 'fixed_amount') {
    return formatCurrency(discountValue, settings);
  }

  return formatCurrency(discountValue, settings);
}
