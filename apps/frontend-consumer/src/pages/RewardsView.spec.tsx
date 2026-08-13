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
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'r2',
    name: 'Gold Only',
    type: 'gopay',
    stock: 3,
    point_price: 2000,
    exclusive_days: 30,
    source_id: 's2',
    min_tier: { id: 'g', name: 'Gold', level: 3 },
    created_at: new Date().toISOString(),
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
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'r4',
    name: 'Too Expensive',
    type: 'gopay',
    stock: 5,
    point_price: 999999,
    exclusive_days: 0,
    source_id: 's4',
    min_tier: null,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const bronzeProfile = {
  tier: { id: 'b', name: 'Bronze', level: 1, min_points: 0 },
  lifetime_points: 100,
  balance_points: 5000,
  next_tier: { id: 's', name: 'Silver', min_points: 10000 },
};

const goldProfile = {
  tier: { id: 'g', name: 'Gold', level: 3, min_points: 50000 },
  lifetime_points: 60000,
  balance_points: 5000,
  next_tier: null,
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
    expect(goldButtons[0]).toBeDisabled();
  });

  it('enables claim for a min_tier reward with no exclusive window', async () => {
    (rewardsApi.getRewards as any).mockResolvedValue([
      {
        id: 'nw1',
        name: 'No Window Reward',
        type: 'gopay',
        stock: 5,
        point_price: 0,
        exclusive_days: 0,
        source_id: 's1',
        min_tier: { id: 'g', name: 'Gold', level: 3 },
        created_at: new Date().toISOString(),
      },
    ]);
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    expect(claimButtons.length).toBeGreaterThan(0);
    expect(claimButtons[0]).toBeEnabled();
    expect(screen.queryByText(/requires gold/i)).toBeNull();
  });

  it('enables claim for a below-tier user once the exclusive window has elapsed', async () => {
    (rewardsApi.getRewards as any).mockResolvedValue([
      {
        id: 'el1',
        name: 'Elapsed Window Reward',
        type: 'gopay',
        stock: 5,
        point_price: 0,
        exclusive_days: 30,
        source_id: 's1',
        min_tier: { id: 'g', name: 'Gold', level: 3 },
        created_at: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ]);
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    expect(claimButtons.length).toBeGreaterThan(0);
    expect(claimButtons[0]).toBeEnabled();
    expect(screen.queryByText(/requires gold/i)).toBeNull();
  });

  it('enables claim when user tier is above the reward min_tier during the window', async () => {
    (pointsApi.getPointsProfile as any).mockResolvedValue(goldProfile);
    (rewardsApi.getRewards as any).mockResolvedValue([
      {
        id: 'ab1',
        name: 'Above Min Reward',
        type: 'gopay',
        stock: 5,
        point_price: 0,
        exclusive_days: 30,
        source_id: 's1',
        min_tier: { id: 'b', name: 'Bronze', level: 1 },
        created_at: new Date().toISOString(),
      },
    ]);
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const claimButtons = await screen.findAllByRole('button', {
      name: /^claim$/i,
    });
    expect(claimButtons.length).toBeGreaterThan(0);
    expect(claimButtons[0]).toBeEnabled();
    expect(screen.queryByText(/requires bronze/i)).toBeNull();
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
    expect(outButtons[0]).toBeDisabled();
  });

  it('disables claim for insufficient points reward', async () => {
    render(
      <MemoryRouter>
        <RewardsView />
      </MemoryRouter>,
    );
    const insufficientButtons = await screen.findAllByRole('button', {
      name: /insufficient points/i,
    });
    expect(insufficientButtons.length).toBeGreaterThan(0);
    expect(insufficientButtons[0]).toBeDisabled();
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
