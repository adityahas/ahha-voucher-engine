import { useAuthStore } from '../store/auth.store';

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  categories: ProductCategory[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const getBaseUrl = () => {
  return import.meta.env.VITE_PRODUCT_API_BASE_URL || 'http://client1.ahha-be.local';
};

const getHeaders = () => {
  const { apiKey, tenant, token } = useAuthStore.getState() as any;
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-tenant-override': tenant,
    Authorization: `Bearer ${token}`,
  };
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${getBaseUrl()}/product-admin/products`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch products');
  }

  const result = await response.json();
  return result.data || result;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await fetch(`${getBaseUrl()}/product-admin/products/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to fetch product details for id: ${id}`);
  }

  const result = await response.json();
  return result.data || result;
};

export const createProduct = async (product: Partial<Product>): Promise<Product> => {
  const response = await fetch(`${getBaseUrl()}/product-admin/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create product');
  }

  const result = await response.json();
  return result.data || result;
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
  const response = await fetch(`${getBaseUrl()}/product-admin/products/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update product');
  }

  const result = await response.json();
  return result.data || result;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`${getBaseUrl()}/product-admin/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to delete product');
  }
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await fetch(`${getBaseUrl()}/product-admin/product-categories`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to fetch product categories');
  }

  const result = await response.json();
  return result.data || result;
};
