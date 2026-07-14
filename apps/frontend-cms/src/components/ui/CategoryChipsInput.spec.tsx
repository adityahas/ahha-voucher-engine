// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryChipsInput } from './CategoryChipsInput';
import * as api from '../../api/products';

vi.mock('../../api/products', () => ({
  getProductCategories: vi.fn(),
  getProductById: vi.fn(),
  getProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

describe('CategoryChipsInput', () => {
  const mockOnChange = vi.fn();
  const sampleCategories = [
    { id: '1', name: 'Electronics', description: null, icon: null },
    { id: '2', name: 'Groceries', description: null, icon: null },
    { id: '3', name: 'Fashion', description: null, icon: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getProductCategories as any).mockResolvedValue(sampleCategories);
  });

  it('renders correctly with label and initial values', () => {
    render(
      <CategoryChipsInput
        values={['Initial']}
        onChange={mockOnChange}
        label="Test Label"
      />,
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Initial')).toBeInTheDocument();
  });

  it('adds a new chip on Enter', () => {
    render(<CategoryChipsInput values={[]} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/Type and press Enter/i);
    fireEvent.change(input, { target: { value: 'New Category' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(['New Category']);
  });

  it('removes a chip when clicking x', () => {
    render(<CategoryChipsInput values={['Target']} onChange={mockOnChange} />);

    const removeButton = screen.getByRole('button', { name: /Remove Target/i });
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith([]);
  });

  it('shows suggestions when typing', async () => {
    render(<CategoryChipsInput values={[]} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/Type and press Enter/i);
    fireEvent.change(input, { target: { value: 'Elec' } });

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('adds category when clicking suggestion', async () => {
    render(<CategoryChipsInput values={[]} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/Type and press Enter/i);
    fireEvent.change(input, { target: { value: 'Elec' } });

    const suggestion = await screen.findByText('Electronics');
    fireEvent.click(suggestion);

    expect(mockOnChange).toHaveBeenCalledWith(['Electronics']);
  });

  it('closes dropdown on Escape key', async () => {
    render(<CategoryChipsInput values={[]} onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/Type and press Enter/i);
    fireEvent.change(input, { target: { value: 'Elec' } });

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
    });
  });
});
