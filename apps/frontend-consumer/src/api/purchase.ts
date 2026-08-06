import { useAuthStore } from '../store/auth.store';

export interface CreatePurchaseDto {
  product_id: string;
  quantity: number;
  voucher_code?: string;
}

export const executePurchase = async (dto: CreatePurchaseDto): Promise<any> => {
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(`${LOYALTY_API_URL}/loyalty/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-api-key': apiKey || 'client1-api-key',
      'x-tenant-override': 'client1',
    },
    body: JSON.stringify(dto),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Transaction failed');
  }

  return data;
};
