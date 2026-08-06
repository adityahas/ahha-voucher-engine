// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CurrencySettingsPage from './CurrencySettings';
import * as api from '../api/settings';

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('../api/settings', () => ({
  getCurrencySettings: vi.fn(),
  updateCurrencySettings: vi.fn(),
}));

const settings = {
  currency_code: 'USD',
  locale: 'en-US',
  number_format_options: {},
};

describe('CurrencySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getCurrencySettings as ReturnType<typeof vi.fn>).mockResolvedValue(
      settings,
    );
    (api.updateCurrencySettings as ReturnType<typeof vi.fn>).mockResolvedValue(
      settings,
    );
  });

  it('shows loading while settings are being fetched', () => {
    (api.getCurrencySettings as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );

    render(<CurrencySettingsPage />);

    expect(
      screen.getByText('Loading currency settings...'),
    ).toBeInTheDocument();
  });

  it('populates fields from the API', async () => {
    render(<CurrencySettingsPage />);

    expect(await screen.findByDisplayValue('USD')).toBeInTheDocument();
    expect(screen.getByDisplayValue('en-US')).toBeInTheDocument();
  });

  it('updates the live preview when draft values change', async () => {
    render(<CurrencySettingsPage />);
    await screen.findByDisplayValue('USD');
    fireEvent.change(screen.getByDisplayValue('USD'), {
      target: { value: 'EUR' },
    });

    expect(screen.getByText('€12,500.00')).toBeInTheDocument();
  });

  it('edits advanced options as numeric payload values', async () => {
    render(<CurrencySettingsPage />);
    await screen.findByDisplayValue('USD');
    const inputs = screen.getAllByRole('spinbutton');

    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.click(screen.getByLabelText('Use digit grouping'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(api.updateCurrencySettings).toHaveBeenCalled());
    expect(api.updateCurrencySettings).toHaveBeenCalledWith({
      ...settings,
      number_format_options: {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false,
      },
    });
  });

  it('resets advanced overrides without changing currency fields', async () => {
    (api.getCurrencySettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...settings,
      number_format_options: { minimumFractionDigits: 0 },
    });
    render(<CurrencySettingsPage />);
    await screen.findByDisplayValue('USD');

    fireEvent.click(screen.getByRole('button', { name: 'Reset overrides' }));

    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(null);
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
  });

  it('shows save success and updates the saved baseline', async () => {
    render(<CurrencySettingsPage />);
    await screen.findByDisplayValue('USD');
    (api.updateCurrencySettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...settings,
      currency_code: 'EUR',
    });
    fireEvent.change(screen.getByDisplayValue('USD'), {
      target: { value: 'EUR' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Currency settings saved.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('preserves the draft when save fails', async () => {
    render(<CurrencySettingsPage />);
    await screen.findByDisplayValue('USD');
    (api.updateCurrencySettings as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Save failed'),
    );
    fireEvent.change(screen.getByDisplayValue('USD'), {
      target: { value: 'EUR' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();
  });

  it('guards navigation while changes are unsaved', async () => {
    render(<CurrencySettingsPage />);
    await screen.findByDisplayValue('USD');
    fireEvent.change(screen.getByDisplayValue('USD'), {
      target: { value: 'EUR' },
    });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
