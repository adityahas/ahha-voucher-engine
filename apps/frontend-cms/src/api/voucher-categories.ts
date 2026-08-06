import { useAuthStore } from '../store/auth.store';

export interface VoucherCategory {
  slug: string;
  name: string;
  description: string;
  image: string;
  created_at?: string;
  updated_at?: string;
}

export const getVoucherCategories = async (): Promise<VoucherCategory[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/voucher-categories`, {
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
    throw new Error(errorData?.message || 'Failed to fetch voucher categories');
  }

  const result = await response.json();
  return result.data || result;
};

export const getVoucherCategoryBySlug = async (
  slug: string,
): Promise<VoucherCategory> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/voucher-categories/${slug}`,
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
    throw new Error(
      errorData?.message ||
        `Failed to fetch voucher category details for slug: ${slug}`,
    );
  }

  const result = await response.json();
  return result.data || result;
};

export const createVoucherCategory = async (
  category: Partial<VoucherCategory>,
): Promise<VoucherCategory> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(`${baseUrl}/loyalty-admin/voucher-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-tenant-override': tenant,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create voucher category');
  }

  const result = await response.json();
  return result.data || result;
};

export const updateVoucherCategory = async (
  slug: string,
  category: Partial<VoucherCategory>,
): Promise<VoucherCategory> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/voucher-categories/${slug}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-tenant-override': tenant,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(category),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update voucher category');
  }

  const result = await response.json();
  return result.data || result;
};

export const deleteVoucherCategory = async (slug: string): Promise<void> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl =
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080';

  const response = await fetch(
    `${baseUrl}/loyalty-admin/voucher-categories/${slug}`,
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
    throw new Error(errorData?.message || 'Failed to delete voucher category');
  }
};
