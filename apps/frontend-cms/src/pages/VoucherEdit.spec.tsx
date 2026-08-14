// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoucherEdit } from './VoucherEdit';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ code: 'VOU-10' }),
}));

vi.mock('../api/vouchers', () => ({
  getVoucherByCode: vi.fn(),
  updateVoucher: vi.fn(),
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategories: vi.fn().mockResolvedValue([]),
}));

vi.mock('../api/users', () => ({
  getUsers: vi.fn().mockResolvedValue([]),
}));

describe('VoucherEdit claim period', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the existing claim_period from the voucher', async () => {
    const { getVoucherByCode } = await import('../api/vouchers');
    (getVoucherByCode as any).mockResolvedValue({
      code: 'VOU-10',
      voucher_type: 'CLAIMABLE',
      claim_period: 'WEEKLY',
      description: 'x',
      quota: 5,
      image: null,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      categories: [],
      allow_combine_categories: [],
      target_users: [],
    });

    render(<VoucherEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('WEEKLY');
    });
  });

  it('falls back to ONCE when the voucher has no claim_period', async () => {
    const { getVoucherByCode } = await import('../api/vouchers');
    (getVoucherByCode as any).mockResolvedValue({
      code: 'VOU-10',
      voucher_type: 'UNIQUE_CODE',
      description: 'x',
      quota: 5,
      image: null,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      categories: [],
      allow_combine_categories: [],
      target_users: [],
    });

    render(<VoucherEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Claim Period/i)).toHaveValue('ONCE');
    });
    expect(screen.getByLabelText(/Claim Period/i)).toBeDisabled();
  });

  it('submits claim_period with updates', async () => {
    const { getVoucherByCode, updateVoucher } = await import('../api/vouchers');
    (getVoucherByCode as any).mockResolvedValue({
      code: 'VOU-10',
      voucher_type: 'CLAIMABLE',
      claim_period: 'ONCE',
      description: 'x',
      quota: 5,
      image: null,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      categories: [],
      allow_combine_categories: [],
      target_users: [],
    });
    (updateVoucher as any).mockResolvedValue({ code: 'VOU-10' });

    render(<VoucherEdit />);
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Claim Period/i), {
        target: { value: 'MONTHLY' },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(updateVoucher).toHaveBeenCalledWith(
        'VOU-10',
        expect.objectContaining({ claim_period: 'MONTHLY' }),
      );
    });
  });
});
