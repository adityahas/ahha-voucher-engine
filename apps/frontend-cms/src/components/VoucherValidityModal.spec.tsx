/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherValidityModal from './VoucherValidityModal';
import { VoucherValidity } from '../api/vouchers';

describe('VoucherValidityModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    voucherId: 'V123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SHOULD not render when isOpen is false', () => {
    const { container } = render(
      <VoucherValidityModal {...defaultProps} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('SHOULD render create mode correctly with default values', () => {
    render(<VoucherValidityModal {...defaultProps} />);

    expect(screen.getByText('Add Schedule')).toBeInTheDocument();

    // Check default values
    const typeSelect: HTMLSelectElement = screen.getByLabelText(
      /Schedule Type/i,
    ) as HTMLSelectElement;
    expect(typeSelect.value).toBe('daily');

    const startTimeInput: HTMLInputElement = screen.getByLabelText(
      /Start Time/i,
    ) as HTMLInputElement;
    expect(startTimeInput.value).toBe('00:00:00');

    const endTimeInput: HTMLInputElement = screen.getByLabelText(
      /End Time/i,
    ) as HTMLInputElement;
    expect(endTimeInput.value).toBe('23:59:59');
  });

  it('SHOULD show validation error if start date is empty for non-birthday schedule', async () => {
    render(<VoucherValidityModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /Save Schedule/i });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText('Start Date is required'),
    ).toBeInTheDocument();
  });

  it('SHOULD call onSave with formatted payload on successful submit for one_time', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);
    render(<VoucherValidityModal {...defaultProps} />);

    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-10-10' } });

    const typeSelect = screen.getByLabelText(/Schedule Type/i);
    fireEvent.change(typeSelect, { target: { value: 'one_time' } });

    const endDateInput = screen.getByLabelText(/End Date/i);
    fireEvent.change(endDateInput, { target: { value: '2024-10-20' } });

    const saveButton = screen.getByRole('button', { name: /Save Schedule/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        type: 'one_time',
        start_date: new Date('2024-10-10').toISOString(),
        end_date: new Date('2024-10-20').toISOString(),
        start_time: '00:00:00',
        end_time: '23:59:59',
        valid_days: null,
      });
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('SHOULD call onSave with valid_days for custom_day_weekly schedule', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);
    render(<VoucherValidityModal {...defaultProps} />);

    const typeSelect = screen.getByLabelText(/Schedule Type/i);
    fireEvent.change(typeSelect, { target: { value: 'custom_day_weekly' } });

    const startDateInput = screen.getByLabelText(/Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2024-10-10' } });

    const saveButton = screen.getByRole('button', { name: /Save Schedule/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        type: 'custom_day_weekly',
        start_date: new Date('2024-10-10').toISOString(),
        end_date: null,
        start_time: '00:00:00',
        end_time: '23:59:59',
        valid_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      });
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('SHOULD render edit mode with existing validity data', () => {
    const mockValidity: VoucherValidity = {
      id: 5,
      type: 'daily',
      start_date: '2025-01-01T00:00:00.000Z',
      end_date: null,
      start_time: '09:00:00',
      end_time: '18:00:00',
    };
    render(<VoucherValidityModal {...defaultProps} validity={mockValidity} />);

    expect(screen.getByText('Edit Schedule')).toBeInTheDocument();

    const typeSelect: HTMLSelectElement = screen.getByLabelText(
      /Schedule Type/i,
    ) as HTMLSelectElement;
    expect(typeSelect.value).toBe('daily');

    const startDateInput: HTMLInputElement = screen.getByLabelText(
      /Start Date/i,
    ) as HTMLInputElement;
    expect(startDateInput.value).toBe('2025-01-01');

    const startTimeInput: HTMLInputElement = screen.getByLabelText(
      /Start Time/i,
    ) as HTMLInputElement;
    expect(startTimeInput.value).toBe('09:00:00');
  });

  it('SHOULD render birthday mode banner and hide date/time inputs', () => {
    const mockValidity: VoucherValidity = {
      id: 5,
      type: 'birthday',
      start_date: '2025-01-01T00:00:00.000Z',
      end_date: null,
      start_time: '00:00:00',
      end_time: '23:59:59',
    };
    render(<VoucherValidityModal {...defaultProps} validity={mockValidity} />);

    expect(screen.getByText('Birthday Reward Schedule')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Start Date/i)).toBeNull();
    expect(screen.queryByLabelText(/Start Time/i)).toBeNull();
  });
});
