import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RewardItemSourceForm from './RewardItemSourceForm';

describe('RewardItemSourceForm', () => {
  it('validates required fields and sends optional fields only when populated', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RewardItemSourceForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText(/name is required/i)).toBeTruthy();
    expect(screen.getByText(/type is required/i)).toBeTruthy();
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'GoPay' },
    });
    fireEvent.change(screen.getAllByRole('textbox')[1], {
      target: { value: 'gopay' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'GoPay',
        source_type: 'gopay',
      }),
    );
  });

  it('masks the API key and toggles visibility for newly entered values', () => {
    const { container } = render(<RewardItemSourceForm onSubmit={vi.fn()} />);
    const input = container.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.change(input, { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /show api key/i }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
