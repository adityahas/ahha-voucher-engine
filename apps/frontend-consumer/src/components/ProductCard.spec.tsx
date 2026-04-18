import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';
import type { Product } from '../types/product';

// Mock framer-motion to avoid JSDOM issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockProduct: Product = {
  id: '1',
  name: 'Premium Voucher Pack',
  description: 'A collection of high-value vouchers.',
  price: 150000,
  image: 'https://example.com/item.jpg',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Premium Voucher Pack')).toBeInTheDocument();
    expect(screen.getByText('A collection of high-value vouchers.')).toBeInTheDocument();
    expect(screen.getByText(/IDR 150,000/)).toBeInTheDocument();
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockProduct.image);
    expect(img).toHaveAttribute('alt', mockProduct.name);
  });

  it('renders fallback icon when image is missing', () => {
    const productWithoutImage = { ...mockProduct, image: undefined };
    const { container } = render(<ProductCard product={productWithoutImage} />);
    
    // Should not have an img tag
    expect(container.querySelector('img')).toBeNull();
    // Should have the SVG icon (ShoppingBag) as placeholder
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onBuy when purchase button is clicked', () => {
    const onBuyMock = vi.fn();
    render(<ProductCard product={mockProduct} onBuy={onBuyMock} />);

    const buyButton = screen.getByRole('button', { name: /Purchase Now/i });
    fireEvent.click(buyButton);

    expect(onBuyMock).toHaveBeenCalledTimes(1);
    expect(onBuyMock).toHaveBeenCalledWith(mockProduct);
  });

  it('applies glassmorphism classes for aesthetic compliance', () => {
    const { container } = render(<ProductCard product={mockProduct} />);
    const card = container.firstChild as HTMLElement;

    // Check for glass-panel utility class
    expect(card.className).toContain('glass-panel');
    // Check for other vibe styling classes
    expect(card.className).toContain('rounded-2xl');
  });
});
