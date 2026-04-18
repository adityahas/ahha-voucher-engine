import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserList } from './UserList';

// Setup mock Zustand store values
vi.mock('../store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      apiKey: 'test-api-key',
      tenant: 'test-tenant',
      token: 'fake-jwt-token',
    })),
  },
}));

// Setup mock window fetch
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('UserList Feature (Automation Engineer)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_API_BASE_URL', 'http://client1.ahha-be.local');
  });

  const setup = () => {
    return render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>,
    );
  };

  it('SHOULD display a loading state initially', async () => {
    // Arrange
    fetchMock.mockReturnValue(new Promise(() => {})); // Never resolves to keep it "loading"

    // Act
    setup();

    // Assert
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('SHOULD successfully fetch and render a list of users matching Vibe Aesthetics', async () => {
    // Arrange
    const mockSuccessResponse = {
      message: 'Success',
      data: [
        {
          id: '1',
          name: 'Jane Doe',
          email: 'jane@test.local',
          role: 'ADMIN',
          is_active: true,
          created_at: '2026-03-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'John Smith',
          email: 'john@test.local',
          role: 'MANAGER',
          is_active: false,
          created_at: '2026-03-05T00:00:00Z',
        },
      ],
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    // Act
    setup();

    // Assert
    // Wait for the table to populate
    await waitFor(() => {
      // Data assertions
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@test.local')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();

      // Aesthetic assertions: Active tags vs Inactive tags
      const activeTags = screen.getAllByText('Active');
      expect(activeTags[0]).toBeInTheDocument();
      expect(activeTags[0].closest('span')).toHaveClass('bg-green-500/10');

      const inactiveTags = screen.getAllByText('Inactive');
      expect(inactiveTags[0]).toBeInTheDocument();
      expect(inactiveTags[0].closest('span')).toHaveClass('bg-red-500/10');
    });
  });

  it('SHOULD display a robust error state if the API fails', async () => {
    // Arrange
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized Error 401' }),
    });

    // Act
    setup();

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Unauthorized Error 401')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument(); // Retry button
    });
  });
});
