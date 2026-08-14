import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TierForm from './TierForm';

describe('TierForm', () => {
  it('submits level_up_voucher_code with the tier', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<TierForm initial={{ name: 'Gold' }} onSubmit={onSubmit} />);

    const field = screen.getByPlaceholderText(
      'e.g. GOLD2030',
    ) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'GOLD2030' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.level_up_voucher_code).toBe('GOLD2030');
  });
});
