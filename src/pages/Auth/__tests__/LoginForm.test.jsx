// src/pages/Auth/__tests__/LoginForm.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended Jest matchers like .toBeInTheDocument()
import { vi } from 'vitest'; // Import 'vi' for Vitest's mocking utilities

// Import the component to be tested
import LoginForm from '../LoginForm';

// Import necessary modules to mock
import AuthContext from '../../../contexts/AuthContext';
import apiService from '../../../services/apiService';
import { logDebug } from '../../../utils/debugLogger'; // Import logDebug for consistency

// --- Mocking Dependencies ---
// Mock the apiService module using vi.mock
vi.mock('../../../services/apiService', () => ({
  // Correctly mock the default export of apiService
  default: {
    request: vi.fn(), // Mock the 'request' method using vi.fn
  },
}));

// Mock implementations for AuthContext values
const mockSetUser = vi.fn();
const mockSetToken = vi.fn();
const mockShowFlashMessage = vi.fn();
// This mock will be dynamically set in renderLoginForm to ensure it calls the correct currentPageSetter
let mockRedirectToDashboard = vi.fn();

// Create a helper function to render the LoginForm within a mocked AuthContext
const renderLoginForm = (currentPageSetter) => {
  // Reassign mockRedirectToDashboard for each render to ensure it uses the correct currentPageSetter
  mockRedirectToDashboard = vi.fn((role) => {
    // Simulate the actual redirectToDashboard logic from App.jsx
    switch (role) {
      case 'super_admin':
      case 'school_admin':
      case 'hod':
      case 'teacher':
      case 'student':
        currentPageSetter({ name: 'dashboard', data: null });
        break;
      default:
        currentPageSetter({ name: 'login', data: null });
        break;
    }
  });

  return render(
    <AuthContext.Provider value={{
      user: null, // Initial user state is null for login form
      token: null, // Initial token state is null for login form
      setUser: mockSetUser,
      setToken: mockSetToken,
      showFlashMessage: mockShowFlashMessage,
      redirectToDashboard: mockRedirectToDashboard, // Use the dynamically updated mock
    }}>
      <LoginForm setCurrentPage={currentPageSetter} />
    </AuthContext.Provider>
  );
};

// --- Test Suite for LoginForm ---
describe('LoginForm', () => {
  // Clear all mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks(); // Use vi.clearAllMocks()
    // Ensure DEBUG_MODE is set for tests if you want to see logDebug output during test runs
    // In a real scenario, you might configure Vitest to set DEBUG_MODE to false for production builds
    // For now, we'll assume logDebug is controlled by its own file's DEBUG_MODE constant.
  });

  // Test Case 1: Component renders correctly
  test('renders login form elements', () => {
    renderLoginForm(vi.fn()); // Pass a mock function for setCurrentPage using vi.fn
    expect(screen.getByText('Login to Zenovation')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/Forgot Password?/i)).toBeInTheDocument();
  });

  // Test Case 2: Input fields update their values
  test('allows users to type into email and password fields', () => {
    renderLoginForm(vi.fn());

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  // Test Case 3: Displays validation errors for empty fields on submission
  test('shows validation errors for empty fields on submit', async () => {
    renderLoginForm(vi.fn());

    // Do NOT type anything into fields to ensure they are empty
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });

    // Ensure API call was NOT made
    expect(apiService.request).not.toHaveBeenCalled();
  });

  // Test Case 4: Handles successful login
  test('handles successful login and redirects to dashboard', async () => {
    // Mock a successful API response
    apiService.request.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'mock_jwt_token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'student' },
      },
    });

    const mockSetCurrentPage = vi.fn();
    renderLoginForm(mockSetCurrentPage); // Pass the mock setCurrentPage

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the asynchronous operations to complete
    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(apiService.request).toHaveBeenCalledWith('/login', 'POST', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockSetToken).toHaveBeenCalledWith('mock_jwt_token');
      expect(mockSetUser).toHaveBeenCalledWith({ id: 1, name: 'Test User', email: 'test@example.com', role: 'student' });
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Login successful!', 'success');
      expect(mockRedirectToDashboard).toHaveBeenCalledWith('student'); // Ensure redirectToDashboard was called
    });

    // Verify that setCurrentPage was called by redirectToDashboard to navigate to dashboard
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'dashboard', data: null });
  });

  // Test Case 5: Handles failed login (API error)
  test('handles failed login and displays error message', async () => {
    // Mock a failed API response
    apiService.request.mockResolvedValueOnce({
      success: false,
      error: {
        message: 'Invalid credentials.',
        code: 'AUTH_FAILED',
      },
    });

    renderLoginForm(vi.fn());

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1);
      expect(mockShowFlashMessage).toHaveBeenCalledWith('Invalid credentials.', 'danger');
    });

    // Ensure no token or user was set on failure
    expect(mockSetToken).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockRedirectToDashboard).not.toHaveBeenCalled();
  });

  // Test Case 6: Handles failed login (validation errors from API)
  test('handles failed login with validation errors from API', async () => {
    // Mock a failed API response with validation errors
    apiService.request.mockResolvedValueOnce({
      success: false,
      error: {
        message: 'The given data was invalid.',
        details: {
          email: ['The email field is required.'],
          password: ['The password field is required.'],
        },
      },
    });

    renderLoginForm(vi.fn());

    // Populate fields to pass client-side validation and trigger API call
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'valid@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'validpassword' } });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(apiService.request).toHaveBeenCalledTimes(1); // Now the API call should be made
      expect(mockShowFlashMessage).toHaveBeenCalledWith('The given data was invalid.', 'danger');
      // Expect validation errors to be displayed, if the component handles them
      expect(screen.getByText('The email field is required.')).toBeInTheDocument();
      expect(screen.getByText('The password field is required.')).toBeInTheDocument();
    });
  });

  // Test Case 7: Navigation to Forgot Password
  test('navigates to forgot password page when link is clicked', () => {
    const mockSetCurrentPage = vi.fn();
    renderLoginForm(mockSetCurrentPage);

    fireEvent.click(screen.getByText(/Forgot Password?/i));

    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'forgot-password', data: null });
  });
});
