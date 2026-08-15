import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserDetail } from './UserDetail';

// Mock the API layer globally
vi.mock('../api/users', () => {
  return {
    getUserById: vi.fn(),
  };
});

vi.mock('../api/user-points', () => ({ assignUserTier: vi.fn() }));
vi.mock('../api/tiers', () => ({ getTiers: vi.fn() }));

import { getUserById } from '../api/users';
import { assignUserTier } from '../api/user-points';
import { getTiers } from '../api/tiers';

describe('UserDetail component tests', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getTiers as any).mockResolvedValue([]);
  });

  // Since we use modern React Router useNavigate internally, we inject MemoryRouter for test layouts
  const renderWithRouter = (
    ui: React.ReactElement,
    initialEntry = '/users/test-uuid-123',
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/users/:id" element={ui} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('SHOULD render Loading Spinner initially on mount', () => {
    // Arrange
    (getUserById as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    // Act
    renderWithRouter(<UserDetail />);

    // Assert
    expect(screen.getByText('Loading user metadata...')).toBeInTheDocument();
  });

  it('SHOULD fetch and render correct properties natively mapping to Vibe Components when resolved', async () => {
    // Arrange
    const mockUser = {
      id: 'test-uuid-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      phone: '555-0100',
      is_active: true,
      is_deleted: false,
      created_at: '2025-01-01T12:00:00.000Z',
      updated_at: '2025-01-02T12:00:00.000Z',
    };
    (getUserById as any).mockResolvedValue(mockUser);

    // Act
    renderWithRouter(<UserDetail />);

    // Assert API Call matches params
    await waitFor(() => {
      expect(getUserById).toHaveBeenCalledWith('test-uuid-123');
    });

    // Assert UI Rendering
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ID: test-uuid-123')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-0100')).toBeInTheDocument();

    // Status badges mapping assertion
    expect(screen.getByText('Active Account')).toBeInTheDocument();
    expect(screen.queryByText('Archived')).not.toBeInTheDocument();
  });

  it('SHOULD render Error fallback Native Component with retry button gracefully when API throws', async () => {
    // Arrange
    (getUserById as any).mockRejectedValue(new Error('Unauthorized Access'));

    // Act
    renderWithRouter(<UserDetail />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('User Not Found')).toBeInTheDocument();
      expect(screen.getByText('Unauthorized Access')).toBeInTheDocument();
    });
  });

  it('assigns a tier and shows the grant email-style feedback', async () => {
    (getUserById as any).mockResolvedValue({
      id: 'test-uuid-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      phone: '555-0100',
      is_active: true,
      is_deleted: false,
      created_at: '2025-01-01T12:00:00.000Z',
      updated_at: '2025-01-02T12:00:00.000Z',
    });
    (getTiers as any).mockResolvedValue([
      { id: 'gold', name: 'Gold' },
      { id: 'bronze', name: 'Bronze' },
    ]);
    (assignUserTier as any).mockResolvedValue({
      granted: true,
      voucherCode: 'GOLD2030',
      message: 'granted',
    });

    renderWithRouter(<UserDetail />);

    const select = await screen.findByLabelText('Assign Tier');
    fireEvent.change(select, { target: { value: 'gold' } });
    fireEvent.click(screen.getByRole('button', { name: /assign tier/i }));

    expect(await screen.findByText(/GOLD2030/)).toBeTruthy();
    expect(assignUserTier).toHaveBeenCalledWith('test-uuid-123', 'gold');
  });
});
