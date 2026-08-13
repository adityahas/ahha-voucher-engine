import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RewardsView from './RewardsView';
import * as rewardsApi from '../api/rewards';
import * as pointsApi from '../api/points';

vi.mock('../api/rewards', () => ({
  getRewards: vi.fn(),
  claimReward: vi.fn(),
}));
vi.mock('../api/points', () => ({
  getPointsProfile: vi.fn(),
}));

const rewards = [
  {
    id: 'r1',
    name: 'GoPay 10k',
    type: 'gopay',
    stock: 5,
    point_price: 1000,
    exclusive_days: 0,
    source_id: 's1',
    min_tier: null,
  },
  {
    id: 'r2',
    name: 'Gold Only',
    type: 'gopay',
    stock: 3,
    point_price: 2000,
    exclusive_days: 30,
    source_id: 's2',
    min_tier: { id: 'g', name: 'Gold' },
  },
  {
    id: 'r3',
    name: 'Out of stock item',
    type: 'gopay',
    stock: 0,
    point_price: 500,
    exclusive_days: 0,
    source_id: 's3',
    min_tier: null,
  },
];

const bronzeProfile = {
  tier: { id: 'b', name: 'Bronze', min_points: 0 },
  lifetime_points: 100,
  balance_points: 5000,
  next_tier: { id: 's', name: 'Silver', min_points: 10000 },
};

describe('RewardsView', () => {
  beforeEach(() => {
    (rewardsApi.getRewards as any).mockResolvedValue(rewards);
    (pointsApi.getPointsProfile as any).mockResolvedValue(bronzeProfile);
  });

  it('renders reward cards', async () => {
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    expect(await screen.findByText('GoPay 10k')).toBeTruthy();
    expect(await screen.findByText('Gold Only')).toBeTruthy();
  });

  it('disables claim for tier-gated reward with hint', async () => {
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const goldButtons = await screen.findAllByRole('button', {
      name: /requires gold/i,
    });
    expect(goldButtons.length).toBeGreaterThan(0);
  });

  it('disables claim for out of stock reward', async () => {
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const outButtons = await screen.findAllByRole('button', {
      name: /out of stock/i,
    });
    expect(outButtons.length).toBeGreaterThan(0);
  });

  it('claims a reward and shows the voucher code', async () => {
    (rewardsApi.claimReward as any).mockResolvedValue({
      status: 'SUCCESS',
      code: 'GOPAY-ABC123',
    });
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    fireEvent.click(claimButtons[0]);
    expect(await screen.findByText(/GOPAY-ABC123/i)).toBeTruthy();
  });

  it('shows error message when claim fails', async () => {
    (rewardsApi.claimReward as any).mockRejectedValue(
      new Error('Insufficient points'),
    );
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    fireEvent.click(claimButtons[0]);
    expect(await screen.findByText(/Insufficient points/i)).toBeTruthy();
  });
});
