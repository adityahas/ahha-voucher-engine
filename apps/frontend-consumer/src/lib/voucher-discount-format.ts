import type { CurrencySettings } from '../types/currency-settings';
import { formatCurrency } from './currency-format';

export function formatVoucherDiscount(
  discountType: string,
  discountValue: number,
  settings: CurrencySettings,
): string {
  return discountType.trim().toLowerCase() === 'percentage'
    ? `${discountValue}% off`
    : formatCurrency(discountValue, settings);
}
