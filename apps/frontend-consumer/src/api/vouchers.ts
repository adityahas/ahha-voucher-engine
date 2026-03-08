import { apiFetch } from './auth';
import type { Voucher } from '../types/voucher';
import { useAuthStore } from '../store/auth.store';

export const getEligibleVouchers = async (userId?: string): Promise<Voucher[]> => {
  // Using port 3003 assuming loyalty-consumer runs there based on typical setups
  // Fallback to relative path if proxy is set up
  const LOYALTY_API_URL = import.meta?.env?.VITE_LOYALTY_API_URL || 'http://client1.ahha-be.local';
  
  const { token, apiKey } = useAuthStore.getState();

  // Endpoint updated to POST /loyalty/vouchers/eligible to accept Body per our fix
  const response = await fetch(`${LOYALTY_API_URL}/loyalty/vouchers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch eligible vouchers');
  }

  return response.json();
};
