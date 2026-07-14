/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherValidityList from './VoucherValidityList';
import * as api from '../api/vouchers';

vi.mock('../api/vouchers', () => ({
  getVoucherValidities: vi.fn(),
  createVoucherValidity: vi.fn(),
  updateVoucherValidity: vi.fn(),
  deleteVoucherValidity: vi.fn(),
}));

describe('VoucherValidityList Component', () => {
  const mockVoucherId = 'VOUCHER1';
  const mockValidities = [
    {
      id: 1,
      type: 'daily',
      start_date: '2024-01-01T00:00:00.000Z',
      end_date: '2024-12-31T23:59:59.000Z',
      start_time: '10:00:00',
      end_time: '22:00:00',
    },
    {
      id: 2,
      type: 'birthday',
      start_date: '2025-01-01T00:00:00.000Z',
      end_date: null,
      start_time: '00:00:00',
      end_time: '23:59:59',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD render loading state initially', () => {
    (api.getVoucherValidities as any).mockReturnValue(new Promise(() => {}));
    render(<VoucherValidityList voucherId={mockVoucherId} />);
    expect(screen.getByText('Loading schedules...')).toBeInTheDocument();
  });

  it('SHOULD display validities on success', async () => {
    (api.getVoucherValidities as any).mockResolvedValue(mockValidities);
    render(<VoucherValidityList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('DAILY')).toBeInTheDocument();
      expect(screen.getByText('BIRTHDAY')).toBeInTheDocument();
      // Test time formats
      expect(screen.getByText('10:00:00 - 22:00:00')).toBeInTheDocument();
      expect(screen.getByText('00:00:00 - 23:59:59')).toBeInTheDocument();
    });
  });

  it('SHOULD display empty state if no data', async () => {
    (api.getVoucherValidities as any).mockResolvedValue([]);
    render(<VoucherValidityList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('No Schedules Defined')).toBeInTheDocument();
    });
  });

  it('SHOULD open Add modal when Add Schedule clicked', async () => {
    (api.getVoucherValidities as any).mockResolvedValue([]);
    render(<VoucherValidityList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('No Schedules Defined')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Schedule/i });
    fireEvent.click(addButton);

    expect(
      screen.getByRole('heading', { name: 'Add Schedule' }),
    ).toBeInTheDocument();
  });

  it('SHOULD handle delete confirmation correctly', async () => {
    (api.getVoucherValidities as any).mockResolvedValue(mockValidities);
    (api.deleteVoucherValidity as any).mockResolvedValue(undefined);

    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(<VoucherValidityList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('DAILY')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this schedule?',
      );
      expect(api.deleteVoucherValidity).toHaveBeenCalledWith(mockVoucherId, 1);
      expect(api.getVoucherValidities).toHaveBeenCalledTimes(2);
    });

    confirmSpy.mockRestore();
  });
});
