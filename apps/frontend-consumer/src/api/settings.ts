import { useAuthStore } from '../store/auth.store';
import type { CurrencySettings } from '../types/currency-settings';

const normalize = (result: any): CurrencySettings => {
  const data = result?.data || result;
  return {
    currency_code: data.currency_code,
    locale: data.locale,
    number_format_options: data.number_format_options || {},
  };
};

export const getCurrencySettings = async (): Promise<CurrencySettings> => {
  const BASE_URL =
    import.meta.env.VITE_PRODUCT_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    '';
  const { token, apiKey } = useAuthStore.getState();
  const response = await fetch(`${BASE_URL}/product/settings/currency`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to load currency settings');
  }

  return normalize(await response.json());
};
