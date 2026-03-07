import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login';

// Mock the React Router navigation hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Setup mock window fetch
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('Login Page (Vibe Coding + Multi-Tenant CMS)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubEnv('VITE_API_BASE_URL', 'http://client1.ahha-be.local');
  });

  const setup = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );
  };

  it('SHOULD successfully render the glassmorphic aesthetics', () => {
    // Arrange
    setup();

    // Act
    const glassCard = screen.getByText(/Ahha Voucher/i).closest('.glass-dark');

    // Assert
    expect(glassCard).toBeInTheDocument();
  });

  it('SHOULD require Workspace ID, API Key, Email, and Password on submission', () => {
    // Arrange
    setup();

    // Act & Assert (RTL natively checks for "required" browser attributes on inputs)
    expect(screen.getByPlaceholderText(/e.g. client1/i)).toBeRequired();
    expect(screen.getByPlaceholderText(/Enter client API Key/i)).toBeRequired();
    expect(
      screen.getByPlaceholderText(/admin@ahha-voucher.local/i),
    ).toBeRequired();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeRequired();
  });

  it('SHOULD successfully authenticate and store credentials in localStorage on 200 OK', async () => {
    // Arrange
    const mockSuccessResponse = {
      admin: { id: 1, email: 'admin@test.com' },
      token: 'fake_jwt_token',
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    setup();

    // Act
    fireEvent.change(screen.getByPlaceholderText(/e.g. client1/i), {
      target: { value: 'client1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter client API Key/i), {
      target: { value: 'secret-key' },
    });
    fireEvent.change(screen.getByPlaceholderText(/admin@ahha-voucher.local/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Access Engine/i }));

    // Assert
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://client1.ahha-be.local/admin/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'secret-key',
            'x-tenant-override': 'client1',
          }),
        }),
      );
      expect(localStorage.getItem('ahha_token')).toBe('fake_jwt_token');
      expect(localStorage.getItem('ahha_tenant')).toBe('client1');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('SHOULD show a glowing red toast glass notification on 401 Unauthorized', async () => {
    // Arrange
    const mockErrorResponse = { message: 'Invalid API Key' };

    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    });

    setup();

    // Act
    fireEvent.change(screen.getByPlaceholderText(/Enter client API Key/i), {
      target: { value: 'bad-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Access Engine/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Invalid API Key')).toBeInTheDocument();
      // Verifying Vibe aesthetics: It should be a red styled alert box
      expect(screen.getByText('Invalid API Key').closest('div')).toHaveClass(
        'bg-red-500/10',
      );
    });
  });
});
