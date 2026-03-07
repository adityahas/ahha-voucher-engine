// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherCategoryEdit from './VoucherCategoryEdit';
import * as api from '../api/voucher-categories';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: 'free-shipping' }),
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategoryBySlug: vi.fn(),
  updateVoucherCategory: vi.fn(),
}));

describe('VoucherCategoryEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategory = {
    slug: 'free-shipping',
    name: 'Free Shipping Vouchers',
    description: 'Old Description',
    image: 'https://example.com/old.png',
  };

  it('renders loading state initially', () => {
    (api.getVoucherCategoryBySlug as any).mockImplementation(() => new Promise(() => {}));
    
    render(<VoucherCategoryEdit />);
    expect(screen.getByText('Loading details...')).toBeInTheDocument();
  });

  it('loads category data correctly into forms', async () => {
    (api.getVoucherCategoryBySlug as any).mockResolvedValue(mockCategory);

    render(<VoucherCategoryEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Display Name/i)).toHaveValue('Free Shipping Vouchers');
      expect(screen.getByLabelText(/Description/i)).toHaveValue('Old Description');
      expect(screen.getByLabelText(/Image URL/i)).toHaveValue('https://example.com/old.png');
      expect(screen.getByLabelText(/Unique Slug/i)).toBeDisabled();
      expect(screen.getByLabelText(/Unique Slug/i)).toHaveValue('free-shipping');
    });
  });

  it('submits form successfully and redirects', async () => {
    (api.getVoucherCategoryBySlug as any).mockResolvedValue(mockCategory);
    (api.updateVoucherCategory as any).mockResolvedValue({ id: 1 });

    render(<VoucherCategoryEdit />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Display Name/i)).toHaveValue('Free Shipping Vouchers');
    });

    fireEvent.change(screen.getByLabelText(/Display Name/i), {
      target: { value: 'Updated Name' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(api.updateVoucherCategory).toHaveBeenCalledWith('free-shipping', {
        name: 'Updated Name',
        description: 'Old Description',
        image: 'https://example.com/old.png',
      });
    });

    // Check success state
    expect(await screen.findByText('Category Updated!')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/voucher-categories');
    }, { timeout: 2000 });
  });

  it('displays error message when fetch fails', async () => {
    (api.getVoucherCategoryBySlug as any).mockRejectedValue(new Error('Category not found'));

    render(<VoucherCategoryEdit />);

    await waitFor(() => {
      expect(screen.getByText('Category not found')).toBeInTheDocument();
    });
  });
});
