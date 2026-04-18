import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserEdit } from './UserEdit';
import { getUserById, updateUser } from '../api/users';

// Mock the API layer
vi.mock('../api/users', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

describe('UserEdit Component', () => {
  const mockUser = {
    id: 'test-uuid-123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'ADMIN',
    is_active: true,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/users/edit/test-uuid-123']}>
        <Routes>
          <Route path="/users/edit/:id" element={<UserEdit />} />
        </Routes>
      </MemoryRouter>,
    );

  it('pre-fills the form with user data', async () => {
    (getUserById as any).mockResolvedValueOnce(mockUser);
    renderComponent();

    expect(screen.getByText(/Loading user data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/Email Address/i)).toHaveValue(
        'john@example.com',
      );
      expect(screen.getByLabelText(/Account Status: Active/i)).toBeChecked();
    });
  });

  it('shows error message when update fails', async () => {
    (getUserById as any).mockResolvedValueOnce(mockUser);
    (updateUser as any).mockRejectedValueOnce(new Error('Email already taken'));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('John Doe');
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByText(/Apply Changes/i));

    await waitFor(() => {
      expect(screen.getByText(/Email already taken/i)).toBeInTheDocument();
    });
  });

  it('shows success message and navigates on successful update', async () => {
    (getUserById as any).mockResolvedValueOnce(mockUser);
    (updateUser as any).mockResolvedValueOnce({
      ...mockUser,
      name: 'Jane Doe',
    });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('John Doe');
    });

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.click(screen.getByText(/Apply Changes/i));

    await waitFor(() => {
      expect(screen.getByText(/User Updated!/i)).toBeInTheDocument();
      expect(screen.getByText(/successfully updated/i)).toBeInTheDocument();
    });

    expect(updateUser).toHaveBeenCalledWith('test-uuid-123', {
      name: 'Jane Doe',
      email: 'john@example.com',
      is_active: true,
    });
  });

  it('sends password only when provided', async () => {
    (getUserById as any).mockResolvedValueOnce(mockUser);
    (updateUser as any).mockResolvedValueOnce({ ...mockUser });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Full Name/i)).toHaveValue('John Doe');
    });

    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: 'new-password' },
    });
    fireEvent.click(screen.getByText(/Apply Changes/i));

    await waitFor(() => {
      expect(screen.getByText(/User Updated!/i)).toBeInTheDocument();
    });

    expect(updateUser).toHaveBeenCalledWith('test-uuid-123', {
      name: 'John Doe',
      email: 'john@example.com',
      is_active: true,
      password: 'new-password',
    });
  });
});
