// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherCreate } from './VoucherCreate';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

vi.mock('../api/vouchers', () => ({
  createVoucher: vi.fn(),
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

describe('VoucherCreate claim period', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to ONCE', async () => {
    render(<VoucherCreate />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('ONCE');
    });
  });

  it('is enabled when voucher_type is CLAIMABLE', async () => {
    render(<VoucherCreate />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).not.toBeDisabled();
    });
  });

  it('is disabled and forced to ONCE when voucher_type is UNIQUE_CODE', async () => {
    render(<VoucherCreate />);
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Voucher Type/i), {
        target: { value: 'UNIQUE_CODE' },
      });
    });
    expect(screen.getByLabelText(/Claim Period/i)).toBeDisabled();
    expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('ONCE');
  });

  it('submits the selected claim_period', async () => {
    const { createVoucher } = await import('../api/vouchers');
    (createVoucher as any).mockResolvedValue({ code: 'X' });

    render(<VoucherCreate />);
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Voucher Type/i), {
        target: { value: 'CLAIMABLE' },
      });
      fireEvent.change(screen.getByLabelText(/Claim Period/i), {
        target: { value: 'DAILY' },
      });
      fireEvent.change(screen.getByLabelText(/Voucher Code/i), {
        target: { value: 'PROMO-1' },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /Deploy Campaign/i }));

    await waitFor(() => {
      expect(createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({ claim_period: 'DAILY' }),
      );
    });
  });
});
