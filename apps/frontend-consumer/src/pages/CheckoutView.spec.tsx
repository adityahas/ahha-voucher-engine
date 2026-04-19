import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutView } from './CheckoutView';
import * as productsApi from '../api/products';
import * as purchaseApi from '../api/purchase';
import * as vouchersApi from '../api/vouchers';
import type { Product } from '../types/product';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, animate, initial, ...props }: any) => (
      <div
        className={className}
        data-animate={JSON.stringify(animate)}
        data-initial={JSON.stringify(initial)}
        {...props}
      >
        {children}
      </div>
    ),
    button: ({ children, className, onClick, ...props }: any) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
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

vi.mock('../api/vouchers', () => ({
  calculateDiscount: vi.fn(),
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as any),
    useParams: () => ({ id: 'prod-123' }),
    useNavigate: () => mockNavigate,
  };
});

const mockProduct: Product = {
  id: 'prod-123',
  name: 'Holiday Gift Card',
  description: 'Perfect for seasonal joy',
  price: 100,
  is_active: true,
  created_at: '',
  updated_at: '',
};

describe('CheckoutView Automation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <CheckoutView />
      </MemoryRouter>,
    );

  it('AAA: Arrange, Act, Assert - Initial Load displays product and base subtotal', async () => {
    // Arrange
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);

    // Act
    renderComponent();

    // Assert
    expect(
      screen.getByText(/Initializing Secure Checkout/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument();
      expect(screen.getByTestId('product-price')).toHaveTextContent('$100');
      expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('$100');
    });
  });

  it('updates pricing correctly when quantity increments', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    // Act
    const incrementBtn = screen.getByText('+');
    fireEvent.click(incrementBtn);

    // Assert
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('$200');
    expect(screen.getByTestId('total-amount')).toHaveTextContent('$200');
  });

  it('applies voucher CHRISTMAS2030 successfully and shows discount breakdown', async () => {
    // Arrange
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (vouchersApi.calculateDiscount as any).mockResolvedValue({
      isValid: true,
      discountAmount: 20,
      finalPrice: 80,
      message: 'Voucher applied successfully!',
    });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    // Act
    const voucherInput = screen.getByPlaceholderText(/Enter code/i);
    fireEvent.change(voucherInput, { target: { value: 'CHRISTMAS2030' } });

    const applyBtn = screen.getByText('APPLY');
    fireEvent.click(applyBtn);

    // Assert
    await waitFor(() => {
      expect(vouchersApi.calculateDiscount).toHaveBeenCalledWith({
        voucher_code: 'CHRISTMAS2030',
        product_id: 'prod-123',
        quantity: 1,
      });
      expect(
        screen.getByText(/Voucher Applied Successfully!/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Voucher Savings')).toBeInTheDocument();
      expect(screen.getByText('-$20')).toBeInTheDocument();
      expect(screen.getByText('$80')).toBeInTheDocument(); // Final Total
    });
  });

  it('shows error state when invalid voucher is applied', async () => {
    // Arrange
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (vouchersApi.calculateDiscount as any).mockResolvedValue({
      isValid: false,
      discountAmount: 0,
      finalPrice: 100,
      message: 'Invalid or expired voucher',
    });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    // Act
    const voucherInput = screen.getByPlaceholderText(/Enter code/i);
    fireEvent.change(voucherInput, { target: { value: 'BADCODE' } });
    fireEvent.click(screen.getByText('APPLY'));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Invalid or expired voucher'),
      ).toBeInTheDocument();
      expect(screen.queryByText('Voucher Savings')).not.toBeInTheDocument();
    });
  });

  it('executes purchase with correct consolidated data', async () => {
    // Arrange
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (purchaseApi.executePurchase as any).mockResolvedValue({ success: true });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    // Act
    fireEvent.click(screen.getByText(/Complete Purchase/i));

    // Assert
    expect(purchaseApi.executePurchase).toHaveBeenCalledWith({
      product_id: 'prod-123',
      quantity: 1,
      voucher_code: undefined,
    });

    await waitFor(() => {
      expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    });
  });

  it('Verifies aesthetic directives: glassmorphism presence', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    // Act & Assert
    const container = screen.getByText('Order Summary').closest('div');
    expect(container?.className).toContain('glass-panel');
    // In JSDOM, classes might not expand from @apply, but we check if it is technically there
    // or if we added it explicitly.
    expect(container?.className).toContain('backdrop-blur');
  });
});
