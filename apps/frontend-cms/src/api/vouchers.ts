import { useAuthStore } from '../store/auth.store';
import { VoucherCategory } from './voucher-categories';

export type VoucherType = 'CLAIMABLE' | 'UNIQUE_CODE';

export interface Voucher {
  voucher_type: VoucherType;
  code: string;
  name: string;
  description: string | null;
  quota: number;
  image: string | null;
  categories?: VoucherCategory[];
  allow_combine_categories?: VoucherCategory[];
  target_users?: { id: string; core_user_id: string }[];
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VoucherBinding {
  id: number;
  bind_type:
    'ROLE' | 'PRODUCT_TYPE' | 'PRODUCT_SKU' | 'PRODUCT_VENDOR' | string;
  bind_value: string;
  created_at?: string;
  updated_at?: string;
}

export const getVouchers = async (): Promise<Voucher[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  // According to loyalty-admin/src/main.ts, it listens on 9003
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch vouchers');
  }

  const result = await response.json();

  // Based on VoucherService.findAll returning BasePaginationResponseInterface
  return result.data || result;
};

export const getVoucherByCode = async (code: string): Promise<Voucher> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${code}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message || `Failed to fetch voucher details for code: ${code}`,
    );
  }

  const result = await response.json();

  // Based on VoucherService.findOne returning VoucherEntity
  return result.data || result;
};

export const getVoucherBindings = async (
  voucherId: string,
): Promise<VoucherBinding[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch voucher bindings');
  }

  const result = await response.json();
  return result.data || result;
};

export const createVoucherBinding = async (
  voucherId: string,
  binding: Partial<VoucherBinding>,
): Promise<VoucherBinding> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(binding),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create voucher binding');
  }

  const result = await response.json();
  return result.data || result;
};

export const updateVoucherBinding = async (
  voucherId: string,
  bindingId: number,
  binding: Partial<VoucherBinding>,
): Promise<VoucherBinding> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings/${bindingId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(binding),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update voucher binding');
  }

  const result = await response.json();
  return result.data || result;
};

export const deleteVoucherBinding = async (
  voucherId: string,
  bindingId: number,
): Promise<void> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings/${bindingId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to delete voucher binding');
  }
};

export interface VoucherValidity {
  id: number;
  type: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  created_at?: string;
  updated_at?: string;
}

export const getVoucherValidities = async (
  voucherId: string,
): Promise<VoucherValidity[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/validities`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch voucher validities');
  }

  const result = await response.json();
  return result.data || result;
};

export const createVoucherValidity = async (
  voucherId: string,
  validity: Partial<VoucherValidity>,
): Promise<VoucherValidity> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/validities`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(validity),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create voucher validity');
  }

  const result = await response.json();
  return result.data || result;
};

export const updateVoucherValidity = async (
  voucherId: string,
  validityId: number,
  validity: Partial<VoucherValidity>,
): Promise<VoucherValidity> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/validities/${validityId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(validity),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update voucher validity');
  }

  const result = await response.json();
  return result.data || result;
};

export const deleteVoucherValidity = async (
  voucherId: string,
  validityId: number,
): Promise<void> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/vouchers/${voucherId}/validities/${validityId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to delete voucher validity');
  }
};

export const createVoucher = async (
  voucher: Partial<Voucher>,
): Promise<Voucher> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(voucher),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create voucher');
  }

  const result = await response.json();
  return result.data || result;
};

export const updateVoucher = async (
  code: string,
  voucher: Partial<Voucher>,
): Promise<Voucher> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${code}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(voucher),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update voucher');
  }

  const result = await response.json();
  return result.data || result;
};

export const deleteVoucher = async (code: string): Promise<void> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${code}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to delete voucher');
  }
};
