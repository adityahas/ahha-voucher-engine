import type {
  Voucher,
  VoucherBinding,
  PaginatedResponse,
  ClaimedVoucherInfo,
  CalculateDiscountRequest,
  CalculateDiscountResponse,
} from '../types/voucher';
import { useAuthStore } from '../store/auth.store';

export const findEligibleVouchers = async (
  bindings: VoucherBinding[] = [],
): Promise<Voucher[]> => {
  // Using port 3003 assuming loyalty-consumer runs there based on typical setups
  // Fallback to relative path if proxy is set up
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const { token, apiKey } = useAuthStore.getState();

  // Endpoint updated to POST /loyalty/vouchers to accept Body per our fix
  const response = await fetch(`${LOYALTY_API_URL}/loyalty/vouchers/eligible`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-api-key': apiKey || 'client1-api-key',
      'x-tenant-override': 'client1',
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

export const findEligibleVoucherByCode = async (
  code: string,
): Promise<Voucher | null> => {
  const vouchers = await findEligibleVouchers();
  return vouchers.find((voucher) => voucher.code === code) ?? null;
};

export const claimVoucher = async (
  voucherCode: string,
): Promise<{ success: boolean; message: string }> => {
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(
    `${LOYALTY_API_URL}/loyalty/vouchers/${voucherCode}/claim`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    },
  );

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
    import.meta?.env?.VITE_LOYALTY_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(
    `${LOYALTY_API_URL}/loyalty/vouchers/my?page=${page}&size=${size}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch claimed vouchers');
  }

  return data;
};

export const calculateDiscount = async (
  request: CalculateDiscountRequest,
): Promise<CalculateDiscountResponse> => {
  const LOYALTY_API_URL =
    import.meta?.env?.VITE_LOYALTY_API_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(
    `${LOYALTY_API_URL}/loyalty/vouchers/calculate-discount`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify(request),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to calculate discount');
  }

  return data;
};
