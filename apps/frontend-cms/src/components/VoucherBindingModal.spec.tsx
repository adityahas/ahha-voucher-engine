import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherBindingModal from './VoucherBindingModal';
import { VoucherBinding } from '../api/vouchers';

// We need to mock Framer Motion if it was used, but we used standard CSS animate-in.

describe('VoucherBindingModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    voucherId: 'V900',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD not render when isOpen is false', () => {
    const { container } = render(
      <VoucherBindingModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('SHOULD render create mode correctly', () => {
    render(<VoucherBindingModal {...defaultProps} />);
    expect(screen.getByText('Add Constraint')).toBeInTheDocument();
    expect(screen.getByLabelText(/Binding Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Binding Value/i)).toBeInTheDocument();
  });

  it('SHOULD render edit mode correctly with provided binding', () => {
    const mockBinding: VoucherBinding = {
      id: 1,
      bind_type: 'product_sku',
      bind_value: 'TEST-SKU',
    };
    render(<VoucherBindingModal {...defaultProps} binding={mockBinding} />);

    expect(screen.getByText('Edit Constraint')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TEST-SKU')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PRODUCT SKU')).toBeInTheDocument();
  });

  it('SHOULD show validation error if binding value is empty', async () => {
    render(<VoucherBindingModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /Save Constraint/i });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText('Binding Value is required'),
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('SHOULD call onSave with correct payload on successful submit', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);
    render(<VoucherBindingModal {...defaultProps} />);

    const valueInput = screen.getByPlaceholderText(/e.g., admin, electronics/i);
    fireEvent.change(valueInput, { target: { value: 'NEW-ROLE' } });

    const saveButton = screen.getByRole('button', { name: /Save Constraint/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        bind_type: 'role',
        bind_value: 'NEW-ROLE',
      });
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
