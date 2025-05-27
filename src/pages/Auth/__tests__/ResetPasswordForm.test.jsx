// src/pages/Auth/__tests__/ResetPasswordForm.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // Import userEvent
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import ResetPasswordForm from '../ResetPasswordForm';
import AuthContext from '../../../contexts/AuthContext';
import apiService from '../../../services/apiService';

// Mock apiService
vi.mock('../../../services/apiService', () => ({
  default: {
    request: vi.fn(),
  },
}));

// Mock AuthContext values
const mockShowFlashMessage = vi.fn();

const renderResetPasswordForm = (currentPageSetter, initialData = { email: 'test@example.com', otp: '123456' }) => {
  return render(
    <AuthContext.Provider value={{ showFlashMessage: mockShowFlashMessage }}>
      <ResetPasswordForm setCurrentPage={currentPageSetter} initialData={initialData} />
    </AuthContext.Provider>
  );
};

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders reset password form elements', () => {
    renderResetPasswordForm(vi.fn());
    // Query the heading specifically by its role and name
    expect(screen.getByRole('heading', { name: /reset password/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('allows user to type into new password fields', async () => { // Made async for userEvent
    const user = userEvent.setup(); // Setup userEvent
    renderResetPasswordForm(vi.fn());
    const newPasswordInput = screen.getByLabelText('New Password'); // Use exact label text
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password'); // Use exact label text

    await user.type(newPasswordInput, 'newpass123'); // Use userEvent.type
    await user.type(confirmNewPasswordInput, 'newpass123'); // Use userEvent.type

    expect(newPasswordInput).toHaveValue('newpass123');
    expect(confirmNewPasswordInput).toHaveValue('newpass123');
  });

  test('shows validation error for empty new password', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderResetPasswordForm(vi.fn());
    await user.click(screen.getByRole('button', { name: /reset password/i })); // Use userEvent.click

    await waitFor(() => {
      expect(screen.getByText('New password is required.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error for new password less than 6 characters', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderResetPasswordForm(vi.fn());
    const newPasswordInput = screen.getByLabelText('New Password'); // Use exact label text
    await user.type(newPasswordInput, 'short'); // Use userEvent.type
    await user.click(screen.getByRole('button', { name: /reset password/i })); // Use userEvent.click

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error if passwords do not match', async () => {
    const user = userEvent.setup(); // Setup userEvent
    renderResetPasswordForm(vi.fn());
    const newPasswordInput = screen.getByLabelText('New Password'); // Use exact label text
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password'); // Use exact label text

    await user.type(newPasswordInput, 'newpass123'); // Use userEvent.type
    await user.type(confirmNewPasswordInput, 'mismatch'); // Use userEvent.type
    await user.click(screen.getByRole('button', { name: /reset password/i })); // Use userEvent.click

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('handles successful password reset and navigates to login page', async () => {
    apiService.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'Password updated successfully!' },
    });

    const mockSetCurrentPage = vi.fn();
    const user = userEvent.setup(); // Setup userEvent
    renderResetPasswordForm(mockSetCurrentPage, { email: 'user@example.com', otp: '123456' });

    const newPasswordInput = screen.getByLabelText('New Password'); // Use exact label text
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password'); // Use exact label text

    await user.type(newPasswordInput, 'newsecurepass'); // Use userEvent.type
    await user.type(confirmNewPasswordInput, 'newsecurepass'); // Use userEvent.type
    await user.click(screen.getByRole('button', { name: /reset password/i })); // Use userEvent.click

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(apiService.request).toHaveBeenCalledWith('/reset-password', 'POST', {
        email: 'user@example.com',
        otp: '123456',
        password: 'newsecurepass',
        password_confirmation: 'newsecurepass',
      });
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Password updated successfully!', 'success');
      expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'login', data: null });
    });
  });

  test('handles failed password reset and displays error message', async () => {
    apiService.request.mockResolvedValueOnce({
      success: false,
      error: { message: 'Invalid OTP or email.' },
    });

    const user = userEvent.setup(); // Setup userEvent
    renderResetPasswordForm(vi.fn(), { email: 'user@example.com', otp: 'wrongotp' });

    const newPasswordInput = screen.getByLabelText('New Password'); // Use exact label text
    const confirmNewPasswordInput = screen.getByLabelText('Confirm New Password'); // Use exact label text

    await user.type(newPasswordInput, 'newsecurepass'); // Use userEvent.type
    await user.type(confirmNewPasswordInput, 'newsecurepass'); // Use userEvent.type
    await user.click(screen.getByRole('button', { name: /reset password/i })); // Use userEvent.click

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Invalid OTP or email.', 'danger');
    });
    expect(screen.queryByText('Password updated successfully!')).not.toBeInTheDocument();
  });

  test('navigates back to login page', async () => { // Made async for userEvent
    const user = userEvent.setup(); // Setup userEvent
    const mockSetCurrentPage = vi.fn();
    renderResetPasswordForm(mockSetCurrentPage);

    await user.click(screen.getByText(/back to login/i)); // Use userEvent.click
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'login', data: null });
  });
});
