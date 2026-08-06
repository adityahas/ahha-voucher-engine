import { useAuthStore } from '../store/auth.store';
import {
  DEFAULT_CURRENCY_SETTINGS,
  type CurrencySettings,
} from '../types/currency-settings';

export async function getCurrencySettings(): Promise<CurrencySettings> {
  const baseUrl =
    import.meta.env.VITE_PRODUCT_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '';
  const { apiKey } = useAuthStore.getState();
  const tenant = import.meta.env.VITE_TENANT_OVERRIDE;
  const response = await fetch(`${baseUrl}/product/settings/currency`, {
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
      ...(tenant ? { 'x-tenant-override': tenant } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch currency settings');
  const payload = await response.json();
  const data = payload.data || payload;
  return {
    ...DEFAULT_CURRENCY_SETTINGS,
    ...data,
    number_format_options: {
      ...DEFAULT_CURRENCY_SETTINGS.number_format_options,
      ...(data.number_format_options || {}),
    },
  };
}
