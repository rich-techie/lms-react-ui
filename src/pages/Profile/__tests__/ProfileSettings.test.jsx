// src/pages/Profile/__tests__/ProfileSettings.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Import userEvent
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import ProfileSettings from '../ProfileSettings';
import AuthContext from '../../../contexts/AuthContext';
import apiService from '../../../services/apiService';

// Mock apiService
vi.mock('../../../services/apiService', () => ({
  default: {
    request: vi.fn(),
  },
}));

// Mock AuthContext values
const mockSetToken = vi.fn();
const mockSetUser = vi.fn();
const mockShowFlashMessage = vi.fn();

const renderProfileSettings = (currentPageSetter, user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'student' }, token = 'mock_token') => {
  return render(
    <AuthContext.Provider value={{
      user,
      token,
      setToken: mockSetToken,
      setUser: mockSetUser,
      showFlashMessage: mockShowFlashMessage,
    }}>
      <ProfileSettings setCurrentPage={currentPageSetter} />
    </AuthContext.Provider>
  );
};

describe('ProfileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders change password form elements', () => {
    renderProfileSettings(vi.fn());
    // Query the heading specifically by its role and name
    expect(screen.getByRole('heading', { name: /change password/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
  });

  test('allows user to type into password fields', async () => { // Made async for userEvent
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPasswordInput, 'oldpass');
    await user.type(newPasswordInput, 'newsecurepass');
    await user.type(confirmNewPasswordInput, 'newsecurepass');

    expect(currentPasswordInput).toHaveValue('oldpass');
    expect(newPasswordInput).toHaveValue('newsecurepass');
    expect(confirmNewPasswordInput).toHaveValue('newsecurepass');
  });

  test('shows validation error for empty current password', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password');

    await user.type(newPasswordInput, 'newsecurepass');
    await user.type(confirmNewPasswordInput, 'newsecurepass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Current password is required.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error for empty new password', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());
    const currentPasswordInput = screen.getByLabelText('Current Password');
    await user.type(currentPasswordInput, 'oldpass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('New password is required.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error for new password less than 6 characters', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');

    await user.type(currentPasswordInput, 'oldpass');
    await user.type(newPasswordInput, 'short');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 6 characters.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error if new and confirm new passwords do not match', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPasswordInput, 'oldpass');
    await user.type(newPasswordInput, 'newsecurepass');
    await user.type(confirmNewPasswordInput, 'mismatch');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error if new password is same as current password', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPasswordInput, 'samepass');
    await user.type(newPasswordInput, 'samepass');
    await user.type(confirmNewPasswordInput, 'samepass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText('New password cannot be the same as the current password.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('handles successful password change and logs out user', async () => {
    apiService.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'Password updated successfully!' },
    });

    const mockSetCurrentPage = vi.fn();
    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(mockSetCurrentPage);

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPasswordInput, 'oldpass123');
    await user.type(newPasswordInput, 'newsecurepass123');
    await user.type(confirmNewPasswordInput, 'newsecurepass123');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(apiService.request).toHaveBeenCalledWith('/profile/reset-password', 'POST', {
        current_password: 'oldpass123',
        new_password: 'newsecurepass123',
        new_password_confirmation: 'newsecurepass123',
      }, 'mock_token'); // Ensure token is passed
      // Expect the exact message that the mock provides
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Password updated successfully!', 'success');
      expect(mockSetToken).toHaveBeenCalledWith(null); // Token cleared
      expect(mockSetUser).toHaveBeenCalledWith(null); // User cleared
      expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'login', data: null }); // Redirect to login
    });
  });

  test('handles failed password change and displays error message', async () => {
    apiService.request.mockResolvedValueOnce({
      success: false,
      error: { message: 'Incorrect current password.' },
    });

    const user = userEvent.setup(); // Setup userEvent
    renderProfileSettings(vi.fn());

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password');

    await user.type(currentPasswordInput, 'wrongoldpass');
    await user.type(newPasswordInput, 'newsecurepass');
    await user.type(confirmNewPasswordInput, 'newsecurepass');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Incorrect current password.', 'danger');
    });
    expect(mockSetToken).not.toHaveBeenCalled(); // Token should not be cleared on failure
    expect(mockSetUser).not.toHaveBeenCalled(); // User should not be cleared on failure
  });

  test('navigates back to dashboard page', async () => { // Made async for userEvent
    const user = userEvent.setup(); // Setup userEvent
    const mockSetCurrentPage = vi.fn();
    renderProfileSettings(mockSetCurrentPage);

    await user.click(screen.getByText(/back to dashboard/i));
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'dashboard', data: null });
  });
});
