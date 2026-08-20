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
    expect(screen.getAllByText('Users')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Vouchers')[0]).toBeInTheDocument();
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
      const el = screen.getAllByText(label)[0];
      expect(el).toBeInTheDocument();
      expect(el.closest('a')).toHaveAttribute('href', to);
    });
  });

  it('renders mobile navigation bar with core links', () => {
    renderLayout();

    const mobileNav = screen.getByRole('navigation', {
      name: 'Mobile Navigation',
    });
    expect(mobileNav).toBeInTheDocument();

    const mobileLinks: Array<[string, string]> = [
      ['Dashboard', '/dashboard'],
      ['Products', '/products'],
      ['Vouchers', '/vouchers'],
      ['Rewards', '/rewards'],
      ['Users', '/users'],
      ['Settings', '/settings/currency'],
    ];

    mobileLinks.forEach(([label, to]) => {
      const link = mobileNav.querySelector(`a[href="${to}"]`);
      expect(link).toBeInTheDocument();
    });
  });
});
