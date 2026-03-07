// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoucherCategoryList from './VoucherCategoryList';
import * as api from '../api/voucher-categories';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../api/voucher-categories', () => ({
  getVoucherCategories: vi.fn(),
  deleteVoucherCategory: vi.fn(),
}));

describe('VoucherCategoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategories = [
    {
      slug: 'free-shipping',
      name: 'Free Shipping',
      description: 'Categories for free shipping vouchers',
      image: 'https://example.com/shipping.png',
    },
    {
      slug: 'discount',
      name: 'Discount',
      description: 'General discount vouchers',
      image: '',
    },
  ];

  it('renders loading state initially', () => {
    (api.getVoucherCategories as any).mockImplementation(() => new Promise(() => {}));
    
    render(<VoucherCategoryList />);
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });

  it('renders category list correctly after loading', async () => {
    (api.getVoucherCategories as any).mockResolvedValue(mockCategories);

    render(<VoucherCategoryList />);

    await waitFor(() => {
      expect(screen.getByText('Free Shipping')).toBeInTheDocument();
      expect(screen.getByText('free-shipping')).toBeInTheDocument();
      expect(screen.getByText('Discount')).toBeInTheDocument();
      expect(screen.getByText('discount')).toBeInTheDocument();
    });
  });

  it('navigates to create page on Create Category click', async () => {
    (api.getVoucherCategories as any).mockResolvedValue([]);
    render(<VoucherCategoryList />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Category/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Category/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/voucher-categories/create');
  });

  it('navigates to edit page on edit button click', async () => {
    (api.getVoucherCategories as any).mockResolvedValue(mockCategories);
    render(<VoucherCategoryList />);

    await waitFor(() => {
      expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/voucher-categories/free-shipping/edit');
  });

  it('calls deleteVoucherCategory when delete button is clicked and confirmed', async () => {
    (api.getVoucherCategories as any).mockResolvedValue(mockCategories);
    (api.deleteVoucherCategory as any).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<VoucherCategoryList />);

    await waitFor(() => {
      expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(api.deleteVoucherCategory).toHaveBeenCalledWith('free-shipping');
    
    // Should re-fetch
    await waitFor(() => {
      expect(api.getVoucherCategories).toHaveBeenCalledTimes(2);
    });
  });

  it('displays error message when API fails', async () => {
    (api.getVoucherCategories as any).mockRejectedValue(new Error('API Down'));

    render(<VoucherCategoryList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load categories')).toBeInTheDocument();
      expect(screen.getByText('API Down')).toBeInTheDocument();
    });
  });
});
