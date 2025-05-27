// src/pages/Auth/__tests__/OTPVerificationForm.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import OTPVerificationForm from '../OTPVerificationForm';
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

const renderOTPVerificationForm = (currentPageSetter, initialData = { email: 'test@example.com' }) => {
  return render(
    <AuthContext.Provider value={{ showFlashMessage: mockShowFlashMessage }}>
      <OTPVerificationForm setCurrentPage={currentPageSetter} initialData={initialData} />
    </AuthContext.Provider>
  );
};

describe('OTPVerificationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders OTP verification form elements with initial email', () => {
    renderOTPVerificationForm(vi.fn(), { email: 'user@example.com' });
    // Query the heading specifically by its role and name
    expect(screen.getByRole('heading', { name: /verify otp/i, level: 2 })).toBeInTheDocument();
    // Use a more robust query for text split across elements
    expect(screen.getByText(/OTP sent to:/i).textContent).toContain('OTP sent to: user@example.com');
    expect(screen.getByLabelText(/otp/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument(); // This will still get the button
    expect(screen.getByText(/resend otp \/ back/i)).toBeInTheDocument();
  });

  test('allows user to type into OTP field', () => {
    renderOTPVerificationForm(vi.fn());
    const otpInput = screen.getByLabelText(/otp/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(otpInput).toHaveValue('123456');
  });

  test('shows validation error for empty OTP on submit', async () => {
    renderOTPVerificationForm(vi.fn());
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText('OTP is required.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('shows validation error for invalid OTP format on submit', async () => {
    renderOTPVerificationForm(vi.fn());
    const otpInput = screen.getByLabelText(/otp/i);
    fireEvent.change(otpInput, { target: { value: '123' } }); // Too short
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText('OTP must be a 6-digit number.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();

    fireEvent.change(otpInput, { target: { value: 'abcde1' } }); // Non-numeric
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText('OTP must be a 6-digit number.')).toBeInTheDocument();
    });
    expect(apiService.request).not.toHaveBeenCalled();
  });

  test('handles successful OTP verification and navigates to reset-password page', async () => {
    apiService.request.mockResolvedValueOnce({
      success: true,
      data: { message: 'OTP verified successfully!' },
    });

    const mockSetCurrentPage = vi.fn();
    renderOTPVerificationForm(mockSetCurrentPage, { email: 'user@example.com' });

    const otpInput = screen.getByLabelText(/otp/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(apiService.request).toHaveBeenCalledWith('/verify-otp', 'POST', { email: 'user@example.com', otp: '123456' });
      expect(mockShowFlashMessage).toHaveBeenCalledWith('OTP verified successfully!', 'success');
      expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'reset-password', data: { email: 'user@example.com', otp: '123456' } });
    });
  });

  test('handles failed OTP verification and displays error message', async () => {
    apiService.request.mockResolvedValueOnce({
      success: false,
      error: { message: 'Invalid OTP.' },
    });

    renderOTPVerificationForm(vi.fn(), { email: 'user@example.com' });

    const otpInput = screen.getByLabelText(/otp/i);
    fireEvent.change(otpInput, { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Invalid OTP.', 'danger');
    });
  });

  test('navigates back to forgot password page', () => {
    const mockSetCurrentPage = vi.fn();
    renderOTPVerificationForm(mockSetCurrentPage);

    fireEvent.click(screen.getByText(/resend otp \/ back/i));
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'forgot-password', data: null });
  });
});
