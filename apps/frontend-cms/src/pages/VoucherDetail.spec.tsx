import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherDetail } from './VoucherDetail';

// Mock the API layer
vi.mock('../api/vouchers', () => ({
  getVoucherByCode: vi.fn(),
}));

import { getVoucherByCode } from '../api/vouchers';

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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (code = 'PROMO2025') =>
    render(
      <MemoryRouter initialEntries={[`/vouchers/${code}`]}>
        <Routes>
          <Route path="/vouchers/:code" element={<VoucherDetail />} />
        </Routes>
      </MemoryRouter>
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
      expect(screen.getByText('PROMO2025')).toBeInTheDocument();
      expect(screen.getByText(/Special annual promo/i)).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('shows error UI when API fails', async () => {
    (getVoucherByCode as any).mockRejectedValueOnce(new Error('Voucher Engine Timeout'));
    renderComponent('INVALID');

    await waitFor(() => {
      expect(screen.getByText(/Voucher Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/Voucher Engine Timeout/i)).toBeInTheDocument();
    });
  });

  it('renders DEPLETED status when quota is 0', async () => {
    (getVoucherByCode as any).mockResolvedValueOnce({ ...mockVoucher, quota: 0 });
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
});
