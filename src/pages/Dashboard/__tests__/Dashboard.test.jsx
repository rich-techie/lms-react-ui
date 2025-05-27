// src/pages/Dashboard/__tests__/Dashboard.test.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import Dashboard from '../Dashboard';
import AuthContext from '../../../contexts/AuthContext';

// Mock AuthContext values
const mockSetToken = vi.fn();
const mockSetUser = vi.fn();
const mockShowFlashMessage = vi.fn();

const renderDashboard = (currentPageSetter, user) => {
  return render(
    <AuthContext.Provider value={{
      user,
      setToken: mockSetToken,
      setUser: mockSetUser,
      showFlashMessage: mockShowFlashMessage,
    }}>
      <Dashboard setCurrentPage={currentPageSetter} />
    </AuthContext.Provider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders "User data not available" if user is null', () => {
    renderDashboard(vi.fn(), null);
    expect(screen.getByText('User data not available. Please log in.')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('renders common dashboard elements for any logged-in user', () => {
    const mockUser = { id: 1, name: 'Generic User', email: 'generic@example.com', role: 'student' };
    renderDashboard(vi.fn(), mockUser);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /profile settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('renders Super Admin dashboard content', () => {
    const superAdminUser = { id: 2, name: 'Super Admin', email: 'super@example.com', role: 'super_admin' };
    renderDashboard(vi.fn(), superAdminUser);
    expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Super Admin Super Admin!/i)).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('School Management')).toBeInTheDocument();
  });

  test('renders School Admin dashboard content', () => {
    const schoolAdminUser = { id: 3, name: 'School Admin', email: 'school@example.com', role: 'school_admin' };
    renderDashboard(vi.fn(), schoolAdminUser);
    expect(screen.getByText('School Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, School Admin School Admin!/i)).toBeInTheDocument();
    expect(screen.getByText('Teacher Management')).toBeInTheDocument();
    expect(screen.getByText('Student Management')).toBeInTheDocument();
  });

  test('renders HOD dashboard content', () => {
    const hodUser = { id: 4, name: 'HOD User', email: 'hod@example.com', role: 'hod' };
    renderDashboard(vi.fn(), hodUser);
    expect(screen.getByText('HOD Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, HOD HOD User!/i)).toBeInTheDocument();
    expect(screen.getByText('Department Overview')).toBeInTheDocument();
    expect(screen.getByText('Course Management')).toBeInTheDocument();
  });

  test('renders Teacher dashboard content', () => {
    const teacherUser = { id: 5, name: 'Teacher User', email: 'teacher@example.com', role: 'teacher' };
    renderDashboard(vi.fn(), teacherUser);
    expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Teacher Teacher User!/i)).toBeInTheDocument();
    expect(screen.getByText('My Classes')).toBeInTheDocument();
    expect(screen.getByText('Student Attendance')).toBeInTheDocument();
  });

  test('renders Student dashboard content', () => {
    const studentUser = { id: 6, name: 'Student User', email: 'student@example.com', role: 'student' };
    renderDashboard(vi.fn(), studentUser);
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Student Student User!/i)).toBeInTheDocument();
    expect(screen.getByText('My Classes')).toBeInTheDocument();
    expect(screen.getByText('Grades')).toBeInTheDocument();
  });

  test('calls setCurrentPage to navigate to profile settings', () => {
    const mockSetCurrentPage = vi.fn();
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'student' };
    renderDashboard(mockSetCurrentPage, mockUser);

    fireEvent.click(screen.getByRole('button', { name: /profile settings/i }));
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'profile-settings', data: null });
  });

  test('handles logout correctly', () => {
    const mockSetCurrentPage = vi.fn();
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', role: 'student' };
    renderDashboard(mockSetCurrentPage, mockUser);

    // Mock localStorage.removeItem
    const localStorageRemoveItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(localStorageRemoveItemSpy).toHaveBeenCalledWith('authToken');
    expect(mockSetToken).toHaveBeenCalledWith(null);
    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockShowFlashMessage).toHaveBeenCalledWith('Logged out successfully.', 'success');
    expect(mockSetCurrentPage).toHaveBeenCalledWith({ name: 'login', data: null });

    localStorageRemoveItemSpy.mockRestore(); // Clean up the spy
  });
});
