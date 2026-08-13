import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import RewardItemSourceCreate from './RewardItemSourceCreate';
import RewardItemSourceEdit from './RewardItemSourceEdit';
import * as api from '../api/reward-item-sources';

vi.mock('../api/reward-item-sources', () => ({
  createRewardSource: vi.fn(),
  getRewardSource: vi.fn(),
  updateRewardSource: vi.fn(),
}));

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('RewardItemSource pages', () => {
  it('creates a source and navigates back to the list', async () => {
    vi.mocked(api.createRewardSource).mockResolvedValue({} as any);
    render(
      <MemoryRouter initialEntries={['/reward-sources/create']}>
        <Routes>
          <Route
            path="/reward-sources/create"
            element={<RewardItemSourceCreate />}
          />
          <Route path="/reward-sources" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );
    const fields = screen.getAllByRole('textbox');
    fireEvent.change(fields[0], { target: { value: 'GoPay' } });
    fireEvent.change(fields[1], { target: { value: 'gopay' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(api.createRewardSource).toHaveBeenCalledWith({
        name: 'GoPay',
        source_type: 'gopay',
      }),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('/reward-sources');
  });

  it('edits a source and navigates back without sending its masked key', async () => {
    vi.mocked(api.getRewardSource).mockResolvedValue({
      id: '1',
      name: 'GoPay',
      source_type: 'gopay',
      apiKey: 'masked',
    });
    vi.mocked(api.updateRewardSource).mockResolvedValue({} as any);
    render(
      <MemoryRouter initialEntries={['/reward-sources/1/edit']}>
        <Routes>
          <Route
            path="/reward-sources/:id/edit"
            element={<RewardItemSourceEdit />}
          />
          <Route path="/reward-sources" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByDisplayValue('GoPay');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(api.updateRewardSource).toHaveBeenCalledWith('1', {
        name: 'GoPay',
        source_type: 'gopay',
      }),
    );
  });
});
