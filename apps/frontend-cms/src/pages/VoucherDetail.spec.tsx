import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherDetail } from './VoucherDetail';

// Mock the API layer
vi.mock('../api/vouchers', () => ({
  getVoucherByCode: vi.fn(),
  getVoucherBindings: vi.fn().mockResolvedValue([]),
  getVoucherValidities: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../components/VoucherBindingList', () => ({
  VoucherBindingList: () => <div data-testid="binding-list" />,
}));

vi.mock('../components/VoucherValidityList', () => ({
  VoucherValidityList: () => <div data-testid="validity-list" />,
}));

vi.mock('lucide-react', () => ({
  Loader2: (props: any) => <div data-testid="loader" {...props} />,
  AlertCircle: (props: any) => <div {...props} />,
  ArrowLeft: (props: any) => <div {...props} />,
  Calendar: (props: any) => <div {...props} />,
  Ticket: (props: any) => <div {...props} />,
  Clock: (props: any) => <div {...props} />,
  ShieldCheck: (props: any) => <div {...props} />,
  Tag: (props: any) => <div {...props} />,
  Hash: (props: any) => <div {...props} />,
  Database: (props: any) => <div {...props} />,
  ChevronRight: (props: any) => <div {...props} />,
  Plus: (props: any) => <div {...props} />,
  X: (props: any) => <div {...props} />,
  Edit2: (props: any) => <div {...props} />,
  Trash2: (props: any) => <div {...props} />,
  Link: (props: any) => <div {...props} />,
  Users: (props: any) => <div data-testid="users-icon" {...props} />,
}));

import { getVoucherByCode } from '../api/vouchers';
import { getUsers } from '../api/users';

describe('VoucherDetail Component', () => {
  const mockVoucher = {
    code: 'PROMO2025',
    name: 'Promo 2025',
    description: 'Special annual promo',
    quota: 50,
    image: 'https://example.com/promo.png',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-02T12:00:00Z',
    deleted_at: null,
    categories: [{ slug: 'free-shipping', name: 'Free Shipping' }],
    target_users: [{ id: 'user-123', core_user_id: 'core-456' }],
  };

  const mockUsers = [
    { id: 'user-123', name: 'John Doe', email: 'john@example.com' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (code = 'PROMO2025') =>
    render(
      <MemoryRouter initialEntries={[`/vouchers/${code}`]}>
        <Routes>
          <Route path="/vouchers/:code" element={<VoucherDetail />} />
        </Routes>
      </MemoryRouter>,
    );

  it('shows loading state initially', () => {
    (getVoucherByCode as any).mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/Fetching engine data/i)).toBeInTheDocument();
  });

  it('renders voucher details correctly on success', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce(mockVoucher);
    renderComponent('PROMO2025');

    await waitFor(() => {
      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    expect(screen.getAllByText(/PROMO2025/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Special annual promo/i)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('shows error UI when API fails', async () => {
    (getVoucherByCode as any).mockRejectedValueOnce(
      new Error('Voucher Engine Timeout'),
    );
    renderComponent('INVALID');

    await waitFor(() => {
      expect(screen.getByText(/Voucher Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/Voucher Engine Timeout/i)).toBeInTheDocument();
    });
  });

  it('renders DEPLETED status when quota is 0', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce({
      ...mockVoucher,
      quota: 0,
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('DEPLETED')).toBeInTheDocument();
    });
  });

  it('shows image when available', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce(mockVoucher);
    renderComponent();

    await waitFor(() => {
      const img = screen.getByAltText('Voucher Branding') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/promo.png');
    });
  });
  it('renders linked categories correctly', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce(mockVoucher);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    });
  });

  it('renders targeted users correctly', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce(mockVoucher);
    (getUsers as any).mockResolvedValueOnce(mockUsers);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('shows fallback when no users are targeted', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce({
      ...mockVoucher,
      target_users: [],
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/No specific users targeted/i),
      ).toBeInTheDocument();
    });
  });
});
