// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherCategoryDetail from './VoucherCategoryDetail';
import * as api from '../api/voucher-categories';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: 'discount' }),
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategoryBySlug: vi.fn(),
}));

describe('VoucherCategoryDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategory = {
    slug: 'discount',
    name: 'Special Discount',
    description: 'This is a detailed description.',
    image: 'https://example.com/card.png',
    created_at: '2023-10-01T00:00:00Z',
    updated_at: '2023-10-02T00:00:00Z',
  };

  it('renders loading state initially', () => {
    (api.getVoucherCategoryBySlug as any).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<VoucherCategoryDetail />);
    expect(
      screen.getByText('Loading category metadata...'),
    ).toBeInTheDocument();
  });

  it('loads category details successfully', async () => {
    (api.getVoucherCategoryBySlug as any).mockResolvedValue(mockCategory);

    render(<VoucherCategoryDetail />);

    await waitFor(() => {
      expect(screen.getByText('Special Discount')).toBeInTheDocument();
      expect(screen.getByText('discount')).toBeInTheDocument();
      expect(
        screen.getByText('This is a detailed description.'),
      ).toBeInTheDocument();
    });

    // Check dates rendered correctly
    const crDate = new Date('2023-10-01T00:00:00Z').toLocaleDateString();
    expect(screen.getByText(crDate)).toBeInTheDocument();
  });

  it('handles edit button navigation', async () => {
    (api.getVoucherCategoryBySlug as any).mockResolvedValue(mockCategory);
    render(<VoucherCategoryDetail />);

    await waitFor(() => {
      expect(screen.getByText('Special Discount')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit Category/i }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/voucher-categories/discount/edit',
    );
  });

  it('displays error and allows retry when API fails', async () => {
    (api.getVoucherCategoryBySlug as any).mockRejectedValueOnce(
      new Error('Connection error'),
    );

    render(<VoucherCategoryDetail />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load category')).toBeInTheDocument();
      expect(screen.getByText('Connection error')).toBeInTheDocument();
    });

    // Retry
    (api.getVoucherCategoryBySlug as any).mockResolvedValueOnce(mockCategory);

    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));

    await waitFor(() => {
      expect(screen.getByText('Special Discount')).toBeInTheDocument();
    });
  });
});
