import { useAuthStore } from '../store/auth.store';
import type { Product } from '../types/product';

export const getProducts = async (): Promise<Product[]> => {
  const BASE_URL =
    import.meta?.env?.VITE_API_BASE_URL || 'http://client1.ahha-be.local';

  // Based on nginx.conf, we use /product prefix to route to port 9008
  // NestJS controller for consumer is at /products
  const url = `${BASE_URL}/product/products`;

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch products');
  }

  return response.json();
};

export const getProductById = async (id: string): Promise<Product> => {
  const BASE_URL =
    import.meta?.env?.VITE_API_BASE_URL || 'http://client1.ahha-be.local';
  const url = `${BASE_URL}/product/products/${id}`;

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch product ${id}`);
  }

  return response.json();
};
