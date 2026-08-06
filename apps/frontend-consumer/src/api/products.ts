import { useAuthStore } from '../store/auth.store';
import type { Product } from '../types/product';

export const getProducts = async (): Promise<Product[]> => {
  const BASE_URL =
    import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8080';

  // Based on nginx.conf, we use /product prefix to route to port 9008
  // NestJS controller for consumer is at /products
  const url = `${BASE_URL}/product/products`;

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-api-key': apiKey || 'client1-api-key',
      'x-tenant-override': 'client1',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch products');
  }

  const data = await response.json();
  const list = Array.isArray(data) ? data : data.data || [];
  return list.map((item: any) => ({
    ...item,
    image: item.image || item.image_url || '',
    image_url: item.image_url || item.image || '',
  }));
};

export const getProductById = async (id: string): Promise<Product> => {
  const BASE_URL =
    import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8080';
  const url = `${BASE_URL}/product/products/${id}`;

  const { token, apiKey } = useAuthStore.getState();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
      'x-api-key': apiKey || 'client1-api-key',
      'x-tenant-override': 'client1',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch product ${id}`);
  }

  const item = await response.json();
  const productData = item.data || item;
  return {
    ...productData,
    image: productData.image || productData.image_url || '',
    image_url: productData.image_url || productData.image || '',
  };
};
