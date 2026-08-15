import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutView } from './CheckoutView';
import * as productsApi from '../api/products';
import * as purchaseApi from '../api/purchase';
import * as vouchersApi from '../api/vouchers';
import * as pointsApi from '../api/points';
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
  getClaimedVouchers: vi.fn(),
}));

vi.mock('../api/points', () => ({
  getPointsProfile: vi.fn(),
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

const mockClaimedVoucher = {
  id: 1,
  created_at: '2026-08-07T00:00:00.000Z',
  voucher: {
    voucher_type: 'CLAIMABLE',
    code: 'CHRISTMAS2030',
    name: 'Christmast discount voucher 222',
    description: 'desc',
    quota: 96,
    image: '',
    discount_type: 'FIXED_AMOUNT',
    discount_value: 10000,
    categories: [],
    bindings: [],
  },
};

describe('CheckoutView Automation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (pointsApi.getPointsProfile as any).mockResolvedValue({
      tier: null,
      lifetime_points: 150,
      balance_points: 150,
      next_tier: null,
    });
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
      expect(screen.getByTestId('product-price')).toHaveTextContent('Rp 100');
      expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('Rp 100');
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
    expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('Rp 200');
    expect(screen.getByTestId('total-amount')).toHaveTextContent('Rp 200');
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
        points_to_use: 0,
      });
      expect(
        screen.getByText(/Voucher Applied Successfully!/i),
      ).toBeInTheDocument();
      expect(screen.getByText('Voucher Savings')).toBeInTheDocument();
      expect(screen.getByText(/-Rp\s*20/)).toBeInTheDocument();
      // Final Total (multiple "Rp 80" texts exist with the cash remainder note)
      expect(screen.getAllByText(/Rp\s*80/).length).toBeGreaterThan(0);
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
      points_to_use: undefined,
    });

    await waitFor(() => {
      expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    });
  });

  it('shows a level-up grant message when the purchase grants a free voucher', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (purchaseApi.executePurchase as any).mockResolvedValue({
      success: true,
      tier: { id: 'gold', name: 'Gold' },
      level_up_grant: {
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      },
    });
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText(/Complete Purchase/i));

    expect(
      await screen.findByText(
        /You reached Gold tier! Here's your free voucher: GOLD2030/,
      ),
    ).toBeTruthy();
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

  it('opens my-vouchers dropdown on field click and lists codes', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (vouchersApi.getClaimedVouchers as any).mockResolvedValue({
      code: 'SUCCESS',
      message: 'ok',
      data: [mockClaimedVoucher],
      pagination: { page: 0, size: 50, total: 1 },
    });
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
    await waitFor(() => {
      expect(vouchersApi.getClaimedVouchers).toHaveBeenCalled();
      expect(screen.getByText('CHRISTMAS2030')).toBeInTheDocument();
    });
  });

  it('applies the selected voucher automatically on item click', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (vouchersApi.getClaimedVouchers as any).mockResolvedValue({
      code: 'SUCCESS',
      message: 'ok',
      data: [mockClaimedVoucher],
      pagination: { page: 0, size: 50, total: 1 },
    });
    (vouchersApi.calculateDiscount as any).mockResolvedValue({
      isValid: true,
      discountAmount: 10000,
      finalPrice: 0,
      message: 'Voucher applied successfully!',
    });
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
    await waitFor(() =>
      expect(screen.getByText('CHRISTMAS2030')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('CHRISTMAS2030'));
    await waitFor(() => {
      expect(vouchersApi.calculateDiscount).toHaveBeenCalledWith({
        voucher_code: 'CHRISTMAS2030',
        product_id: 'prod-123',
        quantity: 1,
        points_to_use: 0,
      });
      expect(
        screen.getByText(/Voucher Applied Successfully!/i),
      ).toBeInTheDocument();
    });
  });

  it('closes the dropdown on outside click', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (vouchersApi.getClaimedVouchers as any).mockResolvedValue({
      code: 'SUCCESS',
      message: 'ok',
      data: [mockClaimedVoucher],
      pagination: { page: 0, size: 50, total: 1 },
    });
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
    await waitFor(() =>
      expect(screen.getByText('CHRISTMAS2030')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('Order Summary'));
    await waitFor(() => {
      expect(screen.queryByText('CHRISTMAS2030')).not.toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (vouchersApi.getClaimedVouchers as any).mockRejectedValue(
      new Error('Network error'),
    );
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByPlaceholderText(/Enter code/i));
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------
  // Hybrid points payment
  // ---------------------------------------------------------------
  it('defaults points to the maximum valid amount after voucher', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (pointsApi.getPointsProfile as any).mockResolvedValue({
      tier: null,
      lifetime_points: 5000,
      balance_points: 5000,
      next_tier: null,
      point_to_currency_rate: 1,
    });
    (vouchersApi.calculateDiscount as any)
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 0,
        point_discount_amount: 0,
        cash_amount: 80,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 80,
        point_discount_amount: 80,
        cash_amount: 0,
        message: 'ok',
      });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter code/i), {
      target: { value: 'CHRISTMAS2030' },
    });
    fireEvent.click(screen.getByText('APPLY'));

    await waitFor(() => {
      expect(screen.getByTestId('points-input')).toHaveValue(80);
      expect(screen.getByText(/Points Applied \(80 pts\)/)).toBeInTheDocument();
      expect(screen.getByTestId('total-amount')).toHaveTextContent('Rp 0');
    });
    expect(vouchersApi.calculateDiscount).toHaveBeenCalledTimes(2);
    expect(vouchersApi.calculateDiscount).toHaveBeenLastCalledWith({
      voucher_code: 'CHRISTMAS2030',
      product_id: 'prod-123',
      quantity: 1,
      points_to_use: 80,
    });
  });

  it('refreshes the preview when the user edits points', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (pointsApi.getPointsProfile as any).mockResolvedValue({
      tier: null,
      lifetime_points: 5000,
      balance_points: 5000,
      next_tier: null,
      point_to_currency_rate: 1,
    });
    (vouchersApi.calculateDiscount as any)
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 0,
        point_discount_amount: 0,
        cash_amount: 80,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 80,
        point_discount_amount: 80,
        cash_amount: 0,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 30,
        point_discount_amount: 30,
        cash_amount: 50,
        message: 'ok',
      });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter code/i), {
      target: { value: 'CHRISTMAS2030' },
    });
    fireEvent.click(screen.getByText('APPLY'));
    await waitFor(() =>
      expect(screen.getByTestId('points-input')).toHaveValue(80),
    );

    fireEvent.change(screen.getByTestId('points-input'), {
      target: { value: '30' },
    });

    await waitFor(() => {
      expect(vouchersApi.calculateDiscount).toHaveBeenLastCalledWith({
        voucher_code: 'CHRISTMAS2030',
        product_id: 'prod-123',
        quantity: 1,
        points_to_use: 30,
      });
      expect(screen.getByText(/Points Applied \(30 pts\)/)).toBeInTheDocument();
      expect(screen.getByTestId('total-amount')).toHaveTextContent('Rp 50');
    });
  });

  it('shows an error for fractional points and does not submit them', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (pointsApi.getPointsProfile as any).mockResolvedValue({
      tier: null,
      lifetime_points: 5000,
      balance_points: 5000,
      next_tier: null,
      point_to_currency_rate: 1,
    });
    (vouchersApi.calculateDiscount as any)
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 0,
        point_discount_amount: 0,
        cash_amount: 80,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 80,
        point_discount_amount: 80,
        cash_amount: 0,
        message: 'ok',
      });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter code/i), {
      target: { value: 'CHRISTMAS2030' },
    });
    fireEvent.click(screen.getByText('APPLY'));
    await waitFor(() =>
      expect(screen.getByTestId('points-input')).toHaveValue(80),
    );

    fireEvent.change(screen.getByTestId('points-input'), {
      target: { value: '12.5' },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Points must be a non-negative integer/i),
      ).toBeInTheDocument();
    });
    expect(purchaseApi.executePurchase).not.toHaveBeenCalled();
  });

  it('submits points_to_use with the purchase payload', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (pointsApi.getPointsProfile as any).mockResolvedValue({
      tier: null,
      lifetime_points: 5000,
      balance_points: 5000,
      next_tier: null,
      point_to_currency_rate: 1,
    });
    (vouchersApi.calculateDiscount as any).mockResolvedValue({
      isValid: true,
      discountAmount: 20,
      finalPrice: 80,
      subtotal: 100,
      voucher_discount_amount: 20,
      points_used: 30,
      point_discount_amount: 30,
      cash_amount: 50,
      message: 'ok',
    });
    (purchaseApi.executePurchase as any).mockResolvedValue({ success: true });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter code/i), {
      target: { value: 'CHRISTMAS2030' },
    });
    fireEvent.click(screen.getByText('APPLY'));
    await waitFor(() =>
      expect(screen.getByTestId('points-input')).toHaveValue(80),
    );

    fireEvent.change(screen.getByTestId('points-input'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByText(/Complete Purchase/i));

    await waitFor(() => {
      expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    });
    expect(purchaseApi.executePurchase).toHaveBeenCalledWith({
      product_id: 'prod-123',
      quantity: 1,
      voucher_code: 'CHRISTMAS2030',
      points_to_use: 30,
    });
  });

  it('displays the cash remainder note for hybrid purchases', async () => {
    (productsApi.getProductById as any).mockResolvedValue(mockProduct);
    (pointsApi.getPointsProfile as any).mockResolvedValue({
      tier: null,
      lifetime_points: 5000,
      balance_points: 5000,
      next_tier: null,
      point_to_currency_rate: 1,
    });
    (vouchersApi.calculateDiscount as any)
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 0,
        point_discount_amount: 0,
        cash_amount: 80,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 80,
        point_discount_amount: 80,
        cash_amount: 0,
        message: 'ok',
      })
      .mockResolvedValueOnce({
        isValid: true,
        discountAmount: 20,
        finalPrice: 80,
        subtotal: 100,
        voucher_discount_amount: 20,
        points_used: 30,
        point_discount_amount: 30,
        cash_amount: 50,
        message: 'ok',
      });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Holiday Gift Card')).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter code/i), {
      target: { value: 'CHRISTMAS2030' },
    });
    fireEvent.click(screen.getByText('APPLY'));
    await waitFor(() =>
      expect(screen.getByTestId('points-input')).toHaveValue(80),
    );

    fireEvent.change(screen.getByTestId('points-input'), {
      target: { value: '30' },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Cash remainder Rp 50 will be recorded as pending/i),
      ).toBeInTheDocument();
    });
  });
});
