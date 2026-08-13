import { useAuthStore } from '../store/auth.store';

const LOYALTY_API_URL =
  import.meta?.env?.VITE_LOYALTY_API_URL ||
  import.meta?.env?.VITE_API_BASE_URL ||
  'http://localhost:8080';

export const getRewards = async () => {
  const { token, apiKey } = useAuthStore.getState();
  const response = await fetch(`${LOYALTY_API_URL}/rewards`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch rewards');
  return data;
};

export const claimReward = async (rewardId: string) => {
  const { token, apiKey } = useAuthStore.getState();
  const response = await fetch(`${LOYALTY_API_URL}/rewards/claim/${rewardId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to claim reward');
  }
  return data;
};
