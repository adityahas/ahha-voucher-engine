import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherBindingList from './VoucherBindingList';
import * as api from '../api/vouchers';

// Mock the API calls
vi.mock('../api/vouchers', () => ({
  getVoucherBindings: vi.fn(),
  createVoucherBinding: vi.fn(),
  updateVoucherBinding: vi.fn(),
  deleteVoucherBinding: vi.fn(),
}));

describe('VoucherBindingList Component', () => {
  const mockVoucherId = 'VOUCHER100';
  const mockBindings = [
    { id: 1, bind_type: 'role', bind_value: 'admin' },
    { id: 2, bind_type: 'product_sku', bind_value: 'SKU123' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD render loading state initially', () => {
    (api.getVoucherBindings as any).mockReturnValue(new Promise(() => {}));
    render(<VoucherBindingList voucherId={mockVoucherId} />);
    expect(screen.getByText('Loading constraints...')).toBeInTheDocument();
  });

  it('SHOULD fetch and display bindings', async () => {
    (api.getVoucherBindings as any).mockResolvedValue(mockBindings);
    render(<VoucherBindingList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('SKU123')).toBeInTheDocument();
      expect(screen.getByText('ROLE')).toBeInTheDocument();
      expect(screen.getByText('PRODUCT SKU')).toBeInTheDocument();
    });
  });

  it('SHOULD render empty state if no bindings returned', async () => {
    (api.getVoucherBindings as any).mockResolvedValue([]);
    render(<VoucherBindingList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('No Constraints Defined')).toBeInTheDocument();
    });
  });

  it('SHOULD handle delete functionality', async () => {
    (api.getVoucherBindings as any).mockResolvedValue(mockBindings);
    (api.deleteVoucherBinding as any).mockResolvedValue(undefined);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    render(<VoucherBindingList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]); // Delete first binding

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this constraint?',
      );
      expect(api.deleteVoucherBinding).toHaveBeenCalledWith(mockVoucherId, 1);
      // It should also re-fetch the bindings
      expect(api.getVoucherBindings).toHaveBeenCalledTimes(2);
    });

    confirmSpy.mockRestore();
  });

  it('SHOULD open the Add modal when Add Constraint is clicked', async () => {
    (api.getVoucherBindings as any).mockResolvedValue([]);
    render(<VoucherBindingList voucherId={mockVoucherId} />);

    await waitFor(() => {
      expect(screen.getByText('No Constraints Defined')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add Constraint/i });
    fireEvent.click(addButton);

    // Modal should appear
    expect(
      screen.getByRole('heading', { name: 'Add Constraint' }),
    ).toBeInTheDocument();
  });
});
