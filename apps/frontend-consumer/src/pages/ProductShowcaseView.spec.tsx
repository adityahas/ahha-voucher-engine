import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductShowcaseView } from './ProductShowcaseView';
import * as productsApi from '../api/products';
import type { Product } from '../types/product';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
    h1: ({ children, className }: any) => <h1 className={className}>{children}</h1>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock API module
vi.mock('../api/products', () => ({
  getProducts: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Product 1',
    description: 'Desc 1',
    price: 100,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    name: 'Product 2',
    description: 'Desc 2',
    price: 200,
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

describe('ProductShowcaseView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons on initial load', async () => {
    // Return a promise that doesn't resolve immediately
    (productsApi.getProducts as any).mockReturnValue(new Promise(() => {}));
    
    const { container } = render(<ProductShowcaseView />);
    
    // Skeletons have animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders product cards after successful fetch', async () => {
    (productsApi.getProducts as any).mockResolvedValue(mockProducts);
    
    render(<ProductShowcaseView />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('renders empty state when no products are returned', async () => {
    (productsApi.getProducts as any).mockResolvedValue([]);
    
    render(<ProductShowcaseView />);

    await waitFor(() => {
      expect(screen.getByText(/Our shelves are empty/i)).toBeInTheDocument();
    });
  });

  it('renders error message when API fails', async () => {
    (productsApi.getProducts as any).mockRejectedValue(new Error('Backend Offline'));
    
    render(<ProductShowcaseView />);

    await waitFor(() => {
      expect(screen.getByText('Backend Offline')).toBeInTheDocument();
      expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
    });
  });
});
