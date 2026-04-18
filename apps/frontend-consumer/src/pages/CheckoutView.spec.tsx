import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutView } from './CheckoutView';
import * as productsApi from '../api/products';
import * as purchaseApi from '../api/purchase';
import type { Product } from '../types/product';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
    button: ({ children, className, onClick, ...props }: any) => <button className={className} onClick={onClick} {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock API modules
vi.mock('../api/products', () => ({
  getProductById: vi.fn(),
}));

vi.mock('../api/purchase', () => ({
  executePurchase: vi.fn(),
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useParams: () => ({ id: 'prod-123' }),
    useNavigate: () => mockNavigate,
  };
});

const mockProduct: Product = {
  id: 'prod-123',
  name: 'Ultra Voucher',
  description: 'Premium experience',
  price: 50000,
  is_active: true,
  created_at: '',
  updated_at: '',
};

describe('CheckoutView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <CheckoutView />
    </MemoryRouter>
  );

  it('fetches and displays product information', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    
    renderComponent();

    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Ultra Voucher/i)).toBeInTheDocument();
      expect(screen.getAllByText(/50/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('updates total when quantity changes', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    
    renderComponent();

    await waitFor(() => expect(screen.getByText(/Ultra Voucher/i)).toBeInTheDocument());

    const addButton = screen.getByText('+');
    fireEvent.click(addButton);

    // Quantity should be 2 now (initial was 1, but let's be sure about the implementation)
    // Actually our CheckoutView.tsx starts at 1.
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Subtotal and Total might both be 100,000
    const totals = screen.getAllByText(/100/);
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it('applies voucher and shows discount', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    
    renderComponent();

    await waitFor(() => expect(screen.getByText(/Ultra Voucher/i)).toBeInTheDocument());

    const voucherInput = screen.getByPlaceholderText(/Enter code/i);
    fireEvent.change(voucherInput, { target: { value: 'SAVE10' } });

    expect(screen.getByText('APPLIED')).toBeInTheDocument();
    // Discount and new total should be visible
    expect(screen.getByText(/Voucher Discount/i)).toBeInTheDocument();
  });

  it('handles successful purchase workflow', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (purchaseApi.executePurchase as any).mockResolvedValue({ success: true });
    
    renderComponent();

    await waitFor(() => expect(screen.getByText(/Ultra Voucher/i)).toBeInTheDocument());

    const buyButton = screen.getByText(/Complete Purchase/i);
    fireEvent.click(buyButton);

    expect(purchaseApi.executePurchase).toHaveBeenCalledWith({
      product_id: 'prod-123',
      quantity: 1,
      voucher_code: undefined
    });

    await waitFor(() => {
      expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    });

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    expect(mockNavigate).toHaveBeenCalledWith('/my-vouchers');
  });

  it('handles failed purchase workflow', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (purchaseApi.executePurchase as any).mockRejectedValue(new Error('Insufficient Balance'));
    
    renderComponent();

    await waitFor(() => expect(screen.getByText(/Ultra Voucher/i)).toBeInTheDocument());

    const buyButton = screen.getByText(/Complete Purchase/i);
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
      expect(screen.getByText('Insufficient Balance')).toBeInTheDocument();
    });
  });

  it('navigates back when Buy Now is cancelled', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Ultra Voucher/i)).toBeInTheDocument());

    const backButton = screen.getByText(/Back to Showcase/i);
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalled();
  });
});
