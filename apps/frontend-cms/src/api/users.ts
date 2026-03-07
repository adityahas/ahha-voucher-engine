import { useAuthStore } from '../store/auth.store';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const getUsers = async (): Promise<User[]> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9002';

  const response = await fetch(`${baseUrl}/user-admin/users`, {
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
    throw new Error(errorData?.message || 'Failed to fetch users');
  }

  const result = await response.json();

  // Depending on NestJS interceptors, the array might be nested in 'data' or returned directly.
  return result.data || result;
};

export const getUserById = async (id: string): Promise<User> => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9002';

  const response = await fetch(`${baseUrl}/user-admin/users/${id}`, {
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
      errorData?.message || `Failed to fetch user Details for ID: ${id}`,
    );
  }

  const result = await response.json();

  // Depending on NestJS interceptors, it might be nested inside 'data'
  return result.data || result;
};
