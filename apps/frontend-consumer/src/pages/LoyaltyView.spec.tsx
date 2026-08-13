import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoyaltyView from './LoyaltyView';
import * as pointsApi from '../api/points';

vi.mock('../api/points', () => ({
  getPointsProfile: vi.fn(),
  getPointsHistory: vi.fn(),
}));

const profile = {
  tier: { id: 'g', name: 'Gold', min_points: 50000 },
  lifetime_points: 60000,
  balance_points: 120,
  next_tier: null,
};

const history = {
  code: 'SUCCESS',
  data: [
    {
      id: 'l1',
      event_type: 'EARN',
      amount: 150,
      balance_after: 150,
      occurred_at: '2026-08-01T00:00:00Z',
      reference_id: 'order-1',
    },
  ],
  pagination: { page: 0, size: 10, total: 1 },
};

describe('LoyaltyView', () => {
  beforeEach(() => {
    (pointsApi.getPointsProfile as any).mockResolvedValue(profile);
    (pointsApi.getPointsHistory as any).mockResolvedValue(history);
  });

  it('renders tier badge and recent ledger entries', async () => {
    render(
      <MemoryRouter>
        <LoyaltyView />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Gold Member')).toBeTruthy();
    expect(await screen.findByText('EARN')).toBeTruthy();
    expect(await screen.findByText('+150')).toBeTruthy();
  });

  it('shows error state with retry when profile fetch fails', async () => {
    (pointsApi.getPointsProfile as any).mockRejectedValue(
      new Error('Network error'),
    );
    render(
      <MemoryRouter>
        <LoyaltyView />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText(/unable to load your loyalty profile/i),
    ).toBeTruthy();
  });

  it('still renders the ledger section when the profile fetch fails', async () => {
    (pointsApi.getPointsProfile as any).mockRejectedValue(
      new Error('Network error'),
    );
    render(
      <MemoryRouter>
        <LoyaltyView />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText(/unable to load your loyalty profile/i),
    ).toBeTruthy();
    expect(await screen.findByText('EARN')).toBeTruthy();
  });

  it('fetches the five most recent ledger entries', async () => {
    render(
      <MemoryRouter>
        <LoyaltyView />
      </MemoryRouter>,
    );
    await screen.findByText('Gold Member');
    expect(pointsApi.getPointsHistory).toHaveBeenCalledWith(0, 5);
  });
});
