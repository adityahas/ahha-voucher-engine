import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TierList from './TierList';
import * as tiersApi from '../api/tiers';

vi.mock('../api/tiers', () => ({ getTiers: vi.fn() }));

describe('TierList', () => {
  beforeEach(() => {
    (tiersApi.getTiers as any).mockResolvedValue([
      {
        id: 't1',
        name: 'Bronze',
        level: 1,
        min_points: 0,
        point_multiplier: 1,
      },
      {
        id: 't2',
        name: 'Gold',
        level: 2,
        min_points: 50000,
        point_multiplier: 2,
      },
    ]);
  });

  it('renders tiers from the API', async () => {
    render(
      <MemoryRouter>
        <TierList />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Bronze')).toBeTruthy();
    expect(await screen.findByText('Gold')).toBeTruthy();
  });
});
