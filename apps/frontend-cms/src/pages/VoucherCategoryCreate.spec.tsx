// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherCategoryCreate from './VoucherCategoryCreate';
import * as api from '../api/voucher-categories';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../api/voucher-categories', () => ({
  createVoucherCategory: vi.fn(),
}));

describe('VoucherCategoryCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillForm = () => {
    fireEvent.change(screen.getByLabelText(/Display Name/i), {
      target: { value: 'Free Shipping' },
    });
    fireEvent.change(screen.getByLabelText(/Unique Slug/i), {
      target: { value: 'free-shipping' },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'A test description' },
    });
    fireEvent.change(screen.getByLabelText(/Image URL/i), {
      target: { value: 'https://example.com/img.png' },
    });
  };

  it('renders form structure correctly', () => {
    render(<VoucherCategoryCreate />);
    expect(
      screen.getByRole('heading', { name: /Create Category/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unique Slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Image URL/i)).toBeInTheDocument();
  });

  it('handles user input', () => {
    render(<VoucherCategoryCreate />);

    fillForm();

    expect(screen.getByLabelText(/Display Name/i)).toHaveValue('Free Shipping');
    expect(screen.getByLabelText(/Unique Slug/i)).toHaveValue('free-shipping');
    expect(screen.getByLabelText(/Description/i)).toHaveValue(
      'A test description',
    );
    expect(screen.getByLabelText(/Image URL/i)).toHaveValue(
      'https://example.com/img.png',
    );
  });

  it('submits form successfully and redirects after delay', async () => {
    (api.createVoucherCategory as any).mockResolvedValue({ id: 1 });

    render(<VoucherCategoryCreate />);

    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

    await waitFor(() => {
      expect(api.createVoucherCategory).toHaveBeenCalledWith({
        name: 'Free Shipping',
        slug: 'free-shipping',
        description: 'A test description',
        image: 'https://example.com/img.png',
      });
    });

    // Check success state
    expect(await screen.findByText('Category Created!')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/voucher-categories');
      },
      { timeout: 2000 },
    );
  });

  it('displays error message when API fails', async () => {
    (api.createVoucherCategory as any).mockRejectedValue(
      new Error('Validation failed'),
    );

    render(<VoucherCategoryCreate />);

    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));

    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });
  });
});
