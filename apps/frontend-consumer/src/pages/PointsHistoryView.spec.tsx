import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PointsHistoryView from './PointsHistoryView';
import * as pointsApi from '../api/points';

vi.mock('../api/points', () => ({ getPointsHistory: vi.fn() }));

describe('PointsHistoryView', () => {
  beforeEach(() => {
    (pointsApi.getPointsHistory as any).mockResolvedValue({
      code: 'SUCCESS',
      data: [
        {
          id: 'l1',
          event_type: 'EARN',
          amount: 150,
          balance_after: 150,
          occurred_at: '2026-08-01T00:00:00Z',
        },
      ],
      pagination: { page: 0, size: 10, total: 1 },
    });
  });

  it('renders ledger entries', async () => {
    render(
      <MemoryRouter>
        <PointsHistoryView />
      </MemoryRouter>,
    );
    expect(await screen.findByText('EARN')).toBeTruthy();
    expect(await screen.findByText('+150')).toBeTruthy();
  });
});
