import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RewardForm from './RewardForm';
import * as tiersApi from '../api/tiers';
import * as sourcesApi from '../api/reward-item-sources';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api/tiers', () => ({ getTiers: vi.fn() }));
vi.mock('../api/reward-item-sources', () => ({ getRewardSources: vi.fn() }));

describe('RewardForm', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (tiersApi.getTiers as any).mockResolvedValue([
      { id: 't1', name: 'Gold' },
      { id: 't2', name: 'Platinum' },
    ]);
    (sourcesApi.getRewardSources as any).mockResolvedValue([
      { id: 's1', name: 'Xendit', source_type: 'gopay' },
      { id: 's2', name: 'Internal', source_type: 'pulsa' },
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

  it('selects a reward source and submits its UUID', async () => {
    render(<RewardForm onSubmit={onSubmit} />);

    const sourceSelect = await screen.findByLabelText(/Reward Source/i);
    expect(
      screen.getByRole('option', { name: /Xendit.*gopay/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Source ID/i)).not.toBeInTheDocument();

    fireEvent.change(sourceSelect, { target: { value: 's2' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. GoPay 10k'), {
      target: { value: 'Reward' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. gopay, pulsa'), {
      target: { value: 'pulsa' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ source_id: 's2' }),
      ),
    );
  });

  it('links to source creation when no reward sources exist', async () => {
    (sourcesApi.getRewardSources as any).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <RewardForm onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('link', { name: /create.*source/i }),
    ).toHaveAttribute('href', '/reward-sources/create');
  });
});
