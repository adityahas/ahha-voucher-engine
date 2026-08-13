import { useAuthStore } from '../store/auth.store';

const LOYALTY_API_URL =
  import.meta?.env?.VITE_LOYALTY_API_URL ||
  import.meta?.env?.VITE_API_BASE_URL ||
  'http://localhost:8080';

const getHeaders = () => {
  const { token, apiKey } = useAuthStore.getState();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
  };
};

export interface PointsProfile {
  tier: { id: string; name: string; min_points: number } | null;
  lifetime_points: number;
  balance_points: number;
  next_tier: { id: string; name: string; min_points: number } | null;
}

export const getPointsProfile = async (): Promise<PointsProfile> => {
  const response = await fetch(`${LOYALTY_API_URL}/loyalty/points/profile`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch points profile');
  return response.json();
};

export const getPointsHistory = async (page = 0, size = 10) => {
  const response = await fetch(
    `${LOYALTY_API_URL}/loyalty/points/history?page=${page}&size=${size}`,
    { headers: getHeaders() },
  );
  if (!response.ok) throw new Error('Failed to fetch points history');
  return response.json();
};
