// App.js - Main Application Component
// This is the root component that will handle routing and context for authentication.
// It will conditionally render components based on authentication state and user role.

import React, { useState, useEffect, useRef } from 'react';

// Import components and utilities
import AuthContext from './contexts/AuthContext';
import apiService from './services/apiService';
import FlashMessage from './components/common/FlashMessage';
import LoginForm from './pages/Auth/LoginForm';
import ForgotPasswordForm from './pages/Auth/ForgotPasswordForm';
import OTPVerificationForm from './pages/Auth/OTPVerificationForm';
import ResetPasswordForm from './pages/Auth/ResetPasswordForm';
import Dashboard from './pages/Dashboard/Dashboard';
import ProfileSettings from './pages/Profile/ProfileSettings';
import { logDebug } from './utils/debugLogger';

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState(null);
  const [flashType, setFlashType] = useState(null);

  // Simple Router (manual conditional rendering for simplicity)
  // currentPage now stores an object: { name: 'pageName', data: { ... } }
  const [currentPage, setCurrentPage] = useState({ name: 'login', data: null });

  // Ref to track if the initial mount check has been performed
  const isInitialMount = useRef(true);

  const showFlashMessage = (message, type) => {
    setFlashMessage(message);
    setFlashType(type);
    setTimeout(() => {
      setFlashMessage(null);
      setFlashType(null);
    }, 5000); // Message disappears after 5 seconds
  };

  // Effect to check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Only run this logic on the initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false; // Mark as not initial mount after first run
        logDebug('App.js useEffect: Initial mount check. Current token:', token); // DEBUG LOG

        if (token) {
          const response = await apiService.request('/user', 'GET', null, token);
          logDebug('App.js useEffect: /user API response (processed):', response); // DEBUG LOG
          if (response.success) {
            setUser(response.data);
            logDebug('App.js useEffect: User state set to:', response.data);
            redirectToDashboard(response.data.role); // Navigate based on the fetched user's role
          } else {
            // Token invalid or expired
            logDebug('App.js useEffect: Token invalid or expired on initial check, redirecting to login. Error:', response.error); // DEBUG LOG
            setToken(null);
            localStorage.removeItem('authToken');
            showFlashMessage('Your session has expired. Please log in again.', 'danger');
            setCurrentPage({ name: 'login', data: null });
          }
        } else {
          logDebug('App.js useEffect: No token found on initial check, redirecting to login.');
          setCurrentPage({ name: 'login', data: null });
        }
        setLoading(false);
      }
      // This useEffect now only runs once on mount. Subsequent state changes (like from LoginForm)
      // will not trigger this block, preventing duplicate /user calls.
    };
    checkAuth();
  }, []); // Empty dependency array means it runs only once on mount

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'super_admin':
        setCurrentPage({ name: 'dashboard', data: null }); // Update to object
        break;
      case 'school_admin':
        setCurrentPage({ name: 'dashboard', data: null }); // Update to object
        break;
      case 'hod':
        setCurrentPage({ name: 'dashboard', data: null }); // Update to object
        break;
      case 'teacher':
        setCurrentPage({ name: 'dashboard', data: null }); // Update to object
        break;
      case 'student':
        setCurrentPage({ name: 'dashboard', data: null }); // Update to object
        break;
      default:
        setCurrentPage({ name: 'login', data: null }); // Update to object
        break;
    }
  };

  const authContextValue = {
    user,
    token,
    setUser,
    setToken,
    showFlashMessage,
    redirectToDashboard,
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light"> {/* Bootstrap classes */}
        <div className="text-xl fw-semibold text-secondary">Loading Application...</div> {/* Bootstrap classes */}
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {/* Bootstrap classes for full height, centering, and padding */}
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light p-3 p-sm-4 p-lg-5 w-100">
        <FlashMessage message={flashMessage} type={flashType} onClose={() => setFlashMessage(null)} />
        {currentPage.name === 'login' && <LoginForm setCurrentPage={setCurrentPage} />}
        {currentPage.name === 'forgot-password' && <ForgotPasswordForm setCurrentPage={setCurrentPage} />}
        {currentPage.name === 'verify-otp' && <OTPVerificationForm setCurrentPage={setCurrentPage} initialData={currentPage.data} />} {/* Pass initialData */}
        {currentPage.name === 'reset-password' && <ResetPasswordForm setCurrentPage={setCurrentPage} initialData={currentPage.data} />} {/* Pass initialData */}
        {currentPage.name === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} />}
        {currentPage.name === 'profile-settings' && <ProfileSettings setCurrentPage={setCurrentPage} />}
      </div>
    </AuthContext.Provider>
  );
}
