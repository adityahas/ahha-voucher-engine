import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoucherDashboardView from './VoucherDashboardView';
import { findEligibleVouchers } from '../api/vouchers';
import type { Voucher } from '../types/voucher';

vi.mock('../api/vouchers', () => ({
  findEligibleVouchers: vi.fn(),
}));

vi.mock('../components/vouchers/VoucherCard', () => ({
  VoucherCard: ({ voucher }: { voucher: Voucher }) => (
    <div data-testid="voucher-card">{voucher.code}</div>
  ),
}));

vi.mock('../components/vouchers/BindingSelector', () => ({
  BindingSelector: ({
    onFind,
  }: {
    onFind: (bindings: { bind_type: string; bind_value: string }[]) => void;
  }) => (
    <button
      type="button"
      data-testid="binding-find"
      onClick={() =>
        onFind([{ bind_type: 'brand', bind_value: 'AHHA_BRAND' }])
      }
    >
      Trigger Binding Find
    </button>
  ),
}));

const mockedFindEligibleVouchers = vi.mocked(findEligibleVouchers);

const mockVoucher: Voucher = {
  voucher_type: 'CLAIMABLE',
  code: 'DISC10',
  name: 'Discount 10%',
  description: 'Get 10% discount',
  quota: 10,
  image: '',
  categories: [{ id: 'food', name: 'Food' }],
  bindings: [{ bind_type: 'brand', bind_value: 'AHHA_BRAND' }],
};

describe('VoucherDashboardView', () => {
  beforeEach(() => {
    mockedFindEligibleVouchers.mockReset();
  });

  it('renders voucher cards when eligible vouchers are returned', async () => {
    mockedFindEligibleVouchers.mockResolvedValue([mockVoucher]);

    render(
      <MemoryRouter>
        <VoucherDashboardView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedFindEligibleVouchers).toHaveBeenCalledWith([]);
    });
    expect(await screen.findByTestId('voucher-card')).toHaveTextContent('DISC10');
  });

  it('renders empty state when no vouchers are returned', async () => {
    mockedFindEligibleVouchers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <VoucherDashboardView />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No Vouchers Found')).toBeInTheDocument();
  });

  it('renders error state when loading vouchers fails', async () => {
    mockedFindEligibleVouchers.mockRejectedValue(new Error('Network down'));

    render(
      <MemoryRouter>
        <VoucherDashboardView />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });

  it('requests vouchers with selected bindings when filter action is triggered', async () => {
    mockedFindEligibleVouchers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <VoucherDashboardView />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedFindEligibleVouchers).toHaveBeenCalledWith([]);
    });

    fireEvent.click(screen.getByTestId('binding-find'));

    await waitFor(() => {
      expect(mockedFindEligibleVouchers).toHaveBeenCalledWith([
        { bind_type: 'brand', bind_value: 'AHHA_BRAND' },
      ]);
    });
  });
});
