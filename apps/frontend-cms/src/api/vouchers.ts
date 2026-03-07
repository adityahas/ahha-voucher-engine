import { useAuthStore } from '../store/auth.store';

export interface Voucher {
  code: string;
  name: string;
  description: string | null;
  quota: number;
  image: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VoucherBinding {
  id: number;
  bind_type: 'ROLE' | 'PRODUCT_TYPE' | 'PRODUCT_SKU' | 'PRODUCT_VENDOR' | string;
  bind_value: string;
  created_at?: string;
  updated_at?: string;
}

export const getVouchers = async (): Promise<Voucher[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  // According to loyalty-admin/src/main.ts, it listens on 9003
  const baseUrl = import.meta.env.VITE_LOYALTY_API_BASE_URL || 'http://client1.ahha-be.local';

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
  const baseUrl = import.meta.env.VITE_LOYALTY_API_BASE_URL || 'http://client1.ahha-be.local';

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

export const getVoucherBindings = async (voucherId: string): Promise<VoucherBinding[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl = import.meta.env.VITE_LOYALTY_API_BASE_URL || 'http://client1.ahha-be.local';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings`, {
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
    throw new Error(errorData?.message || 'Failed to fetch voucher bindings');
  }

  const result = await response.json();
  return result.data || result;
};

export const createVoucherBinding = async (voucherId: string, binding: Partial<VoucherBinding>): Promise<VoucherBinding> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl = import.meta.env.VITE_LOYALTY_API_BASE_URL || 'http://client1.ahha-be.local';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(binding),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create voucher binding');
  }

  const result = await response.json();
  return result.data || result;
};

export const updateVoucherBinding = async (voucherId: string, bindingId: number, binding: Partial<VoucherBinding>): Promise<VoucherBinding> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl = import.meta.env.VITE_LOYALTY_API_BASE_URL || 'http://client1.ahha-be.local';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings/${bindingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(binding),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update voucher binding');
  }

  const result = await response.json();
  return result.data || result;
};

export const deleteVoucherBinding = async (voucherId: string, bindingId: number): Promise<void> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl = import.meta.env.VITE_LOYALTY_API_BASE_URL || 'http://client1.ahha-be.local';

  const response = await fetch(`${baseUrl}/loyalty-admin/vouchers/${voucherId}/bindings/${bindingId}`, {
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
    throw new Error(errorData?.message || 'Failed to delete voucher binding');
  }
};
