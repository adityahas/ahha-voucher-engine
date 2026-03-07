import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherList } from './VoucherList';

// Mock the API layer
vi.mock('../api/vouchers', () => ({
  getVouchers: vi.fn(),
}));

import { getVouchers } from '../api/vouchers';

describe('VoucherList Component', () => {
  const mockVouchers = [
    {
      code: 'WELCOME2025',
      description: 'Welcome discount for new users',
      quota: 100,
      image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      categories: [{ slug: 'promo', name: 'Promo' }],
      target_users: [],
    },
    {
      code: 'SOLDOUT',
      description: 'Sold out campaign',
      quota: 0,
      image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      categories: [],
      target_users: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/vouchers']}>
        <Routes>
          <Route path="/vouchers" element={<VoucherList />} />
        </Routes>
      </MemoryRouter>
    );

  it('shows loading state initially', () => {
    (getVouchers as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderComponent();
    expect(screen.getByText(/Synchronizing with engine/i)).toBeInTheDocument();
  });

  it('renders voucher data correctly', async () => {
    (getVouchers as any).mockResolvedValueOnce(mockVouchers);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('WELCOME2025')).toBeInTheDocument();
      expect(screen.getByText('Welcome discount for new users')).toBeInTheDocument();
      expect(screen.getByText('SOLDOUT')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Sold Out')).toBeInTheDocument();
      expect(screen.getByText('Promo')).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    (getVouchers as any).mockRejectedValueOnce(new Error('Internal Server Error'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Engine Connection Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no vouchers returned', async () => {
    (getVouchers as any).mockResolvedValueOnce([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No vouchers found/i)).toBeInTheDocument();
    });
  });

  it('calls fetchVouchers when refresh button is clicked', async () => {
    (getVouchers as any).mockResolvedValueOnce(mockVouchers);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('WELCOME2025')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByText(/Refresh List/i);
    fireEvent.click(refreshBtn);

    expect(getVouchers).toHaveBeenCalledTimes(2);
  });
});
