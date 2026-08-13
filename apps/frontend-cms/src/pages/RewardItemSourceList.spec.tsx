import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RewardItemSourceList from './RewardItemSourceList';
import * as api from '../api/reward-item-sources';

vi.mock('../api/reward-item-sources', () => ({
  getRewardSources: vi.fn(),
  deleteRewardSource: vi.fn(),
}));

describe('RewardItemSourceList', () => {
  beforeEach(() => {
    vi.mocked(api.getRewardSources).mockResolvedValue([
      {
        id: '1',
        name: 'GoPay',
        source_type: 'gopay',
        api_endpoint: 'https://api.example',
        apiKey: 'secret',
      },
    ]);
    vi.mocked(api.deleteRewardSource).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders sources with masked API keys', async () => {
    render(
      <MemoryRouter>
        <RewardItemSourceList />
      </MemoryRouter>,
    );
    expect(await screen.findByText('GoPay')).toBeTruthy();
    expect(screen.getByText('******')).toBeTruthy();
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('confirms deletion and keeps the row visible when deletion fails', async () => {
    vi.mocked(api.deleteRewardSource).mockRejectedValue(
      new Error('Delete failed'),
    );
    render(
      <MemoryRouter>
        <RewardItemSourceList />
      </MemoryRouter>,
    );
    await screen.findByText('GoPay');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(screen.getByText('Delete failed')).toBeTruthy());
    expect(screen.getByText('GoPay')).toBeTruthy();
    expect(window.confirm).toHaveBeenCalled();
  });
});
