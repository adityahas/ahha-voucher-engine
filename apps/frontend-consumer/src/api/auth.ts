import { useAuthStore } from '../store/auth.store';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { apiKey } = useAuthStore.getState();
  const effectiveApiKey = apiKey || 'client1-api-key';

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': effectiveApiKey,
      'x-tenant-override': 'client1',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};
