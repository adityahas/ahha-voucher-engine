import { useAuthStore } from '../store/auth.store';
import type { CurrencySettings } from '../types/currency-settings';

const getHeaders = () => {
  const { apiKey, token } = useAuthStore.getState() as any;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    Authorization: `Bearer ${token}`,
  };
};

const getUrl = () =>
  `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/admin/settings/currency`;

const normalize = (result: any): CurrencySettings => {
  const data = result?.data || result;
  return {
    currency_code: data.currency_code,
    locale: data.locale,
    number_format_options: data.number_format_options || {},
  };
};

const request = async (init?: RequestInit) => {
  const response = await fetch(getUrl(), { ...init, headers: getHeaders() });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to load currency settings');
  }
  return response.json();
};

export const getCurrencySettings = async (): Promise<CurrencySettings> =>
  normalize(await request());

export const updateCurrencySettings = async (
  input: CurrencySettings,
): Promise<CurrencySettings> =>
  normalize(await request({ method: 'PUT', body: JSON.stringify(input) }));
