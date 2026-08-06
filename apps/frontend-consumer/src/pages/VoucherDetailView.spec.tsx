import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoucherDetailView from './VoucherDetailView';
import type { Voucher } from '../types/voucher';
import { findEligibleVoucherByCode } from '../api/vouchers';
import React from 'react';

vi.mock('../api/vouchers', () => ({
  claimVoucher: vi.fn(),
  findEligibleVoucherByCode: vi.fn(),
}));

const mockVoucher: Voucher = {
  code: 'DISC10',
  name: 'Discount 10%',
  description: 'Get 10% discount for selected products.',
  voucher_type: 'CLAIMABLE',
  quota: 5,
  image: '',
  discount_type: 'percentage',
  discount_value: 10,
  categories: [{ id: 'food', name: 'Food' }],
  bindings: [{ bind_type: 'brand', bind_value: 'Ahha' }],
};

const mockedFindEligibleVoucherByCode = vi.mocked(findEligibleVoucherByCode);

describe('VoucherDetailView', () => {
  beforeEach(() => {
    mockedFindEligibleVoucherByCode.mockReset();
  });

  it('renders voucher details from route state without loading fallback API', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/vouchers/DISC10', state: { voucher: mockVoucher } },
        ]}
      >
        <Routes>
          <Route path="/vouchers/:code" element={<VoucherDetailView />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Discount 10%')).toBeInTheDocument();
    expect(screen.getByText('Code: DISC10')).toBeInTheDocument();
    expect(screen.getByText('10% off')).toBeInTheDocument();
    expect(mockedFindEligibleVoucherByCode).not.toHaveBeenCalled();
  });

  it('loads voucher details by code when route state is missing', async () => {
    mockedFindEligibleVoucherByCode.mockResolvedValue(mockVoucher);

    render(
      <MemoryRouter initialEntries={['/vouchers/DISC10']}>
        <Routes>
          <Route path="/vouchers/:code" element={<VoucherDetailView />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedFindEligibleVoucherByCode).toHaveBeenCalledWith('DISC10');
    });
    expect(await screen.findByText('Discount 10%')).toBeInTheDocument();
  });

  it('shows not-found state when voucher lookup returns empty result', async () => {
    mockedFindEligibleVoucherByCode.mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/vouchers/MISSING']}>
        <Routes>
          <Route path="/vouchers/:code" element={<VoucherDetailView />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Voucher Not Found')).toBeInTheDocument();
  });

  it('renders fixed discounts with the tenant currency', async () => {
    const fixedVoucher = {
      ...mockVoucher,
      discount_type: 'FIXED_AMOUNT' as const,
      discount_value: 25000,
    };

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/vouchers/DISC10', state: { voucher: fixedVoucher } },
        ]}
      >
        <Routes>
          <Route path="/vouchers/:code" element={<VoucherDetailView />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/25\.000/)).toBeInTheDocument();
  });
});
