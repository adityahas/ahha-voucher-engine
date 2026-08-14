import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MainLayout } from './MainLayout';

vi.mock('../../store/auth.store', () => ({
  useAuthStore: (selector: (state: any) => any) =>
    selector({
      isAuthenticated: () => true,
      logout: vi.fn(),
      user: { email: 'admin@ahha-voucher.local' },
      tenant: 'client1',
    }),
}));

describe('MainLayout side menu grouping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLayout = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MainLayout />
      </MemoryRouter>,
    );

  it('renders grouped section headings', () => {
    renderLayout();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Vouchers')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Loyalty')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders every nav item with the correct target', () => {
    renderLayout();

    const expected: Array<[string, string]> = [
      ['Dashboard', '/dashboard'],
      ['User Management', '/users'],
      ['Voucher Management', '/vouchers'],
      ['Voucher Categories', '/voucher-categories'],
      ['Product Management', '/products'],
      ['Tier Management', '/tiers'],
      ['Reward Management', '/rewards'],
      ['Reward Sources', '/reward-sources'],
      ['Settings', '/settings/currency'],
    ];

    expected.forEach(([label, to]) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label).closest('a')).toHaveAttribute('href', to);
    });
  });
});
