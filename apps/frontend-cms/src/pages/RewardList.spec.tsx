import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RewardList from './RewardList';
import * as rewardsApi from '../api/rewards';

vi.mock('../api/rewards', () => ({ getRewards: vi.fn() }));

describe('RewardList', () => {
  beforeEach(() => {
    (rewardsApi.getRewards as any).mockResolvedValue([
      { id: 'r1', name: 'GoPay 10k', point_price: 1000, stock: 5 },
    ]);
  });

  it('renders rewards with point price', async () => {
    render(
      <MemoryRouter>
        <RewardList />
      </MemoryRouter>,
    );
    expect(await screen.findByText('GoPay 10k')).toBeTruthy();
    expect(await screen.findByText('1000')).toBeTruthy();
  });
});
