import { useAuthStore } from '../store/auth.store';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://client1.ahha-be.local'; // Pointing to user-consumer api gateway

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const { apiKey } = useAuthStore.getState();

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
};
