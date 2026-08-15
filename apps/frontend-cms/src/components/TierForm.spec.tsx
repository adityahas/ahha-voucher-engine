import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TierForm from './TierForm';
import * as vouchersApi from '../api/vouchers';

vi.mock('../api/vouchers', () => ({ getVouchers: vi.fn() }));

const eligibleVouchers = [
  { code: 'GOLD2030', name: 'Gold 30%', quota: 100, deleted_at: null },
  { code: 'PLAT100', name: 'Platinum Rp100k', quota: -1, deleted_at: null },
];

describe('TierForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (vouchersApi.getVouchers as any).mockResolvedValue(eligibleVouchers);
    onSubmit.mockResolvedValue(undefined);
  });

  it('submits the selected eligible voucher code', async () => {
    render(<TierForm initial={{ name: 'Gold' }} onSubmit={onSubmit} />);

    const select = await screen.findByLabelText(/Level-Up Voucher Code/i);
    expect(select).toHaveValue('');

    // Wait for the voucher options to render before changing the select; a
    // controlled <select> snaps back to an existing option otherwise.
    await screen.findByRole('option', { name: /GOLD2030.*Gold 30%/i });

    fireEvent.change(select, { target: { value: 'GOLD2030' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ level_up_voucher_code: 'GOLD2030' }),
      ),
    );
  });

  it('excludes deleted and exhausted vouchers from the options', async () => {
    (vouchersApi.getVouchers as any).mockResolvedValue([
      ...eligibleVouchers,
      { code: 'DELETED', name: 'Gone', quota: 5, deleted_at: '2026-01-01' },
      { code: 'SOLD', name: 'Sold out', quota: 0, deleted_at: null },
    ]);
    render(
      <TierForm
        initial={{ name: 'Gold', level_up_voucher_code: 'GOLD2030' }}
        onSubmit={onSubmit}
      />,
    );

    // Await the mocked getVouchers resolution via findByRole (positive finds
    // first) so the option assertions below are not racy.
    expect(
      await screen.findByRole('option', { name: /GOLD2030.*Gold 30%/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /PLAT100.*Platinum/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /DELETED/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /SOLD/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps a current non-eligible code visible as inactive on edit', async () => {
    (vouchersApi.getVouchers as any).mockResolvedValue(eligibleVouchers);
    render(
      <TierForm
        initial={{ name: 'Gold', level_up_voucher_code: 'GONE2020' }}
        onSubmit={onSubmit}
      />,
    );

    const select = screen.getByLabelText(/Level-Up Voucher Code/i);
    // Await the mocked getVouchers resolution so the inactive option exists
    // (toHaveValue on a select requires a matching <option>).
    expect(
      await screen.findByRole('option', { name: /GONE2020.*inactive/i }),
    ).toBeInTheDocument();
    expect(select).toHaveValue('GONE2020');
  });

  it('clears the reward when No Voucher is selected', async () => {
    render(
      <TierForm
        initial={{ name: 'Gold', level_up_voucher_code: 'GOLD2030' }}
        onSubmit={onSubmit}
      />,
    );

    const select = await screen.findByLabelText(/Level-Up Voucher Code/i);
    fireEvent.change(select, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ level_up_voucher_code: '' }),
      ),
    );
  });
});
