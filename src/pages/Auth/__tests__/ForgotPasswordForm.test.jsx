// src/pages/Auth/__tests__/ForgotPasswordForm.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import ForgotPasswordForm from '../ForgotPasswordForm';
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

const renderForgotPasswordForm = (currentPageSetter) => {
  return render(
    <AuthContext.Provider value={{ showFlashMessage: mockShowFlashMessage }}>
      <ForgotPasswordForm setCurrentPage={currentPageSetter} />
    </AuthContext.Provider>
  );
};

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders forgot password form elements', () => {
    renderForgotPasswordForm(vi.fn());
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/registered email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request otp/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('allows user to type into email field', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm(vi.fn());
    const emailInput = screen.getByLabelText(/registered email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  test('shows validation error for empty email on submit', async () => {
    const user = userEvent.setup();
    renderForgotPasswordForm(vi.fn());
    await user.click(screen.getByRole('button', { name: /request otp/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  // Re-enabled test case with direct form submission and explicit act wrapper
  test('shows validation error for invalid email format on submit', async () => {
    renderForgotPasswordForm(vi.fn());
    const emailInput = screen.getByLabelText(/registered email/i);
    const submitButton = screen.getByRole('button', { name: /request otp/i });
    const form = screen.getByRole('form'); // Get the form element

    // Directly set the email input value
    fireEvent.change(emailInput, { target: { value: 'debug-invalid-email' } });

    // Wrap the form submission and subsequent waitFor in act
    await act(async () => {
      fireEvent.submit(form); // Submit the form
      await waitFor(() => {
        screen.debug(); // IMPORTANT: Keep this uncommented to see the DOM state
        expect(screen.getByText('Email format is invalid.')).toBeInTheDocument();
      });
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('handles successful OTP request and navigates to verify-otp page', async () => {
    apiService.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'OTP sent successfully!' },
    });

    const mockSetCurrentPage = vi.fn();
    const user = userEvent.setup();
    renderForgotPasswordForm(mockSetCurrentPage);

    const emailInput = screen.getByLabelText(/registered email/i);
    await user.type(emailInput, 'user@example.com');
    await user.click(screen.getByRole('button', { name: /request otp/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(apiService.request).toHaveBeenCalledWith('/forgot-password', 'POST', { email: 'user@example.com' });
      expect(mockShowFlashMessage).toHaveBeenCalledWith('OTP sent successfully!', 'success');
      expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'verify-otp', data: { email: 'user@example.com' } });
    });
  });

  test('handles failed OTP request and displays error message', async () => {
    apiService.request.mockResolvedValueOnce({
      success: false,
      error: { message: 'Email not found.' },
    });

    const user = userEvent.setup();
    renderForgotPasswordForm(vi.fn());

    const emailInput = screen.getByLabelText(/registered email/i);
    await user.type(emailInput, 'nonexistent@example.com');
    await user.click(screen.getByRole('button', { name: /request otp/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Email not found.', 'danger');
    });
    expect(screen.queryByText('OTP sent to')).not.toBeInTheDocument();
  });

  test('navigates back to login page', async () => {
    const user = userEvent.setup();
    const mockSetCurrentPage = vi.fn();
    renderForgotPasswordForm(mockSetCurrentPage);

    await user.click(screen.getByText(/back to login/i));
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'login', data: null });
  });
});
