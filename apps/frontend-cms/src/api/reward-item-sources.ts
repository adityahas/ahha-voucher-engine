import { useAuthStore } from '../store/auth.store';

export interface RewardItemSource {
  id: string;
  name: string;
  source_type: string;
  api_endpoint?: string;
  apiKey?: MaskedApiKey;
}

export type MaskedApiKey = string | null;

export interface AuthState {
  apiKey?: string;
  tenant?: string;
  token?: string;
}

export interface RewardItemSourceInput {
  name: string;
  source_type: string;
  api_endpoint?: string;
  apiKey?: string;
}

const getUrl = () =>
  `${
    import.meta.env.VITE_LOYALTY_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080'
  }/loyalty-admin/reward-item-source`;

const getHeaders = () => {
  const { apiKey, tenant, token } = useAuthStore.getState() as AuthState;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-tenant-override': tenant,
    Authorization: `Bearer ${token}`,
  };
};

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.message ||
        `Reward item source request failed (${response.status})`,
    );
  }

  if (response.status === 204) return undefined as T;

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    return undefined as T;
  }

  return ((result as { data?: T }).data ?? result) as T;
};

export const getRewardSources = (): Promise<RewardItemSource[]> =>
  request(`${getUrl()}?page=0&size=100`, { method: 'GET' });

export const getRewardSource = (id: string): Promise<RewardItemSource> =>
  request(`${getUrl()}/${id}`, { method: 'GET' });

export const createRewardSource = (
  input: RewardItemSourceInput,
): Promise<RewardItemSource> =>
  request(getUrl(), { method: 'POST', body: JSON.stringify(input) });

export const updateRewardSource = (
  id: string,
  input: RewardItemSourceInput,
): Promise<RewardItemSource> =>
  request(`${getUrl()}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const deleteRewardSource = (id: string): Promise<void> =>
  request(`${getUrl()}/${id}`, { method: 'DELETE' }).then(() => undefined);
