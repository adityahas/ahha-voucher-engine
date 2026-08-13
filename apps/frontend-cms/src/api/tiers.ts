import { useAuthStore } from '../store/auth.store';

export interface Tier {
  id: string;
  name: string;
  level: number;
  min_points: number;
  point_multiplier: number;
  extra_discount_percent: number;
  is_active: boolean;
  exclusive_window_hours: number;
  category_overrides?: {
    id: string;
    category: { slug: string; name: string };
    point_multiplier: number;
  }[];
}

export interface TierInput {
  name: string;
  level: number;
  min_points: number;
  point_multiplier: number;
  extra_discount_percent?: number;
  is_active?: boolean;
  exclusive_window_hours?: number;
  category_overrides?: { category_slug: string; point_multiplier: number }[];
}

const getUrl = () =>
  `${
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080'
  }/loyalty-admin/tiers`;

const getHeaders = () => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-tenant-override': tenant,
    Authorization: `Bearer ${token}`,
  };
};

export const getTiers = async (): Promise<Tier[]> => {
  const response = await fetch(`${getUrl()}?page=0&size=100`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch tiers');
  const result = await response.json();
  return result.data ?? result;
};

export const getTier = async (id: string): Promise<Tier> => {
  const response = await fetch(`${getUrl()}/${id}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch tier');
  return response.json();
};

export const createTier = async (input: TierInput): Promise<Tier> => {
  const response = await fetch(getUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create tier');
  return response.json();
};

export const updateTier = async (
  id: string,
  input: TierInput,
): Promise<Tier> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update tier');
  return response.json();
};

export const deleteTier = async (id: string): Promise<void> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete tier');
};
