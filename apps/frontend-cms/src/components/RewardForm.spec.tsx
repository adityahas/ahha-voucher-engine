import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RewardForm from './RewardForm';
import * as tiersApi from '../api/tiers';

vi.mock('../api/tiers', () => ({ getTiers: vi.fn() }));

describe('RewardForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (tiersApi.getTiers as any).mockResolvedValue([
      { id: 't1', name: 'Gold' },
      { id: 't2', name: 'Platinum' },
    ]);
    onSubmit.mockResolvedValue(undefined);
  });

  it('sends min_tier_id: null when a previously-set tier is cleared', async () => {
    render(
      <RewardForm
        initial={{
          name: 'GoPay 10k',
          type: 'gopay',
          stock: 5,
          source_id: 's1',
          point_price: 1000,
          exclusive_days: 1,
          min_tier: { id: 't1', name: 'Gold' },
        }}
        onSubmit={onSubmit}
      />,
    );

    const tierSelect = screen.getByLabelText(/Minimum Tier/i);

    await screen.findByText('Gold');
    expect(tierSelect).toHaveValue('t1');

    fireEvent.change(tierSelect, { target: { value: '' } });
    expect(tierSelect).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ min_tier_id: null }),
      );
    });
  });
});
