import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RewardItemSourceList from './RewardItemSourceList';
import * as api from '../api/reward-item-sources';

vi.mock('../api/reward-item-sources', () => ({
  getRewardSources: vi.fn(),
  deleteRewardSource: vi.fn(),
}));

describe('RewardItemSourceList', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

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

  it('does not call the delete API when deletion is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(
      <MemoryRouter>
        <RewardItemSourceList />
      </MemoryRouter>,
    );
    await screen.findByText('GoPay');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(api.deleteRewardSource).not.toHaveBeenCalled();
    expect(screen.getByText('GoPay')).toBeTruthy();
  });

  it('refreshes the list after successful deletion', async () => {
    vi.mocked(api.getRewardSources).mockClear();
    vi.mocked(api.getRewardSources)
      .mockResolvedValueOnce([
        {
          id: '1',
          name: 'GoPay',
          source_type: 'gopay',
          apiKey: 'secret',
        },
      ])
      .mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <RewardItemSourceList />
      </MemoryRouter>,
    );
    await screen.findByText('GoPay');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() =>
      expect(api.deleteRewardSource).toHaveBeenCalledWith('1'),
    );
    await waitFor(() => expect(api.getRewardSources).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('GoPay')).toBeNull();
  });

  it('renders a list API error', async () => {
    vi.mocked(api.getRewardSources).mockRejectedValue(new Error('Load failed'));
    render(
      <MemoryRouter>
        <RewardItemSourceList />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Load failed')).toBeTruthy();
  });
});
