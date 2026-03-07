import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserCreate } from './UserCreate';

// Mock the API layer
vi.mock('../api/users', () => ({
  createUser: vi.fn(),
}));

import { createUser } from '../api/users';

describe('UserCreate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <UserCreate />
      </MemoryRouter>
    );

  it('renders all form fields', () => {
    renderComponent();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Secure Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mark account as active immediately/i)).toBeInTheDocument();
  });

  it('shows error message when creation fails', async () => {
    (createUser as any).mockRejectedValueOnce(new Error('Invalid email domain'));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@invalid.com' } });
    fireEvent.change(screen.getByLabelText(/Secure Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByText(/Provision Account/i));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email domain/i)).toBeInTheDocument();
    });
  });

  it('shows success message and navigates on successful creation', async () => {
    (createUser as any).mockResolvedValueOnce({ id: '123' });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'New Admin' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'admin@workspace.com' } });
    fireEvent.change(screen.getByLabelText(/Secure Password/i), { target: { value: 'secure-pass' } });

    fireEvent.click(screen.getByText(/Provision Account/i));

    await waitFor(() => {
      expect(screen.getByText(/User Created!/i)).toBeInTheDocument();
      expect(screen.getByText(/account has been successfully provisioned/i)).toBeInTheDocument();
    });

    expect(createUser).toHaveBeenCalledWith({
      name: 'New Admin',
      email: 'admin@workspace.com',
      password: 'secure-pass',
      is_active: true,
    });
  });
});
