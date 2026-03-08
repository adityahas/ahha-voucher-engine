import type { Voucher, VoucherBinding, PaginatedResponse, ClaimedVoucherInfo } from '../types/voucher';
import { useAuthStore } from '../store/auth.store';

export const findEligibleVouchers = async (
  bindings: VoucherBinding[] = [],
): Promise<Voucher[]> => {
  // Using port 3003 assuming loyalty-consumer runs there based on typical setups
  // Fallback to relative path if proxy is set up
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL || 'http://client1.ahha-be.local';

  const { token, apiKey } = useAuthStore.getState();

  // Endpoint updated to POST /loyalty/vouchers to accept Body per our fix
  const response = await fetch(`${LOYALTY_API_URL}/loyalty/vouchers/eligible`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    body: JSON.stringify({
      bindings: bindings,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch eligible vouchers');
  }

  return response.json();
};

export const claimVoucher = async (
  voucherCode: string,
): Promise<{ success: boolean; message: string }> => {
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL || 'http://client1.ahha-be.local';

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(`${LOYALTY_API_URL}/loyalty/vouchers/${voucherCode}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to claim voucher');
  }

  return data;
};

export const getClaimedVouchers = async (
  page: number = 0,
  size: number = 10,
): Promise<PaginatedResponse<ClaimedVoucherInfo>> => {
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL || 'http://client1.ahha-be.local';

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(`${LOYALTY_API_URL}/loyalty/vouchers/my?page=${page}&size=${size}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch claimed vouchers');
  }

  return data;
};
