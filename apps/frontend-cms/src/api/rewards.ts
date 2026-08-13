import { useAuthStore } from '../store/auth.store';

export interface Reward {
  id: string;
  name: string;
  type: string;
  stock: number;
  point_price: number;
  exclusive_days: number;
  source_id: string;
  source?: { id: string; name: string; source_type: string };
  min_tier?: { id: string; name: string } | null;
}

export interface RewardInput {
  name: string;
  type: string;
  stock: number;
  source_id: string;
  point_price?: number;
  min_tier_id?: string;
  exclusive_days?: number;
}

const getUrl = () =>
  `${
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080'
  }/loyalty-admin/reward-item`;

const getHeaders = () => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-tenant-override': tenant,
    Authorization: `Bearer ${token}`,
  };
};

export const getRewards = async (): Promise<Reward[]> => {
  const response = await fetch(`${getUrl()}?page=0&size=100`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch rewards');
  const result = await response.json();
  return result.data ?? result;
};

export const getReward = async (id: string): Promise<Reward> => {
  const response = await fetch(`${getUrl()}/${id}`, { headers: getHeaders() });
  if (!response.ok) throw new Error('Failed to fetch reward');
  return response.json();
};

export const createReward = async (input: RewardInput): Promise<Reward> => {
  const response = await fetch(getUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create reward');
  return response.json();
};

export const updateReward = async (
  id: string,
  input: RewardInput,
): Promise<Reward> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to update reward');
  return response.json();
};

export const deleteReward = async (id: string): Promise<void> => {
  const response = await fetch(`${getUrl()}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete reward');
};
