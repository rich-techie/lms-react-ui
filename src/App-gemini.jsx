// App.js - Main Application Component
// This is the root component that will handle routing and context for authentication.
// It will conditionally render components based on authentication state and user role.

import React, { useState, useEffect, createContext, useContext, useRef } from 'react'; // Import useRef

// Create a context for authentication state and user data
const AuthContext = createContext(null);

// Custom Hook for Auth Context
const useAuth = () => useContext(AuthContext);

// --- Debugging Flag and Custom Log Function ---
const DEBUG_MODE = true; // Set to false for production to disable console logs

const logDebug = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};
// ---------------------------------------------

// API Service Utility (DRY Principle)
// This utility handles all API calls, ensures consistent headers, and parses our standardized responses.
const apiService = {
  // Base URL for your Laravel API
  BASE_URL: 'http://api.lms.com/api', // Adjust if your API URL is different

  /**
   * Makes an authenticated API request.
   * @param {string} endpoint - The API endpoint (e.g., '/login', '/profile/reset-password').
   * @param {string} method - HTTP method (e.g., 'POST', 'GET', 'PUT').
   * @param {object} [data=null] - Request body data.
   * @param {string} [token=null] - Authorization token.
   * @returns {Promise<object>} - Standardized API response.
   */
  async request(endpoint, method, data = null, token = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: method,
      headers: headers,
      body: data ? JSON.stringify(data) : null,
    };

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      const rawJsonResponse = await response.json(); // Capture raw response
      logDebug(`API Service: Raw response for ${endpoint}:`, rawJsonResponse); // DEBUG LOG

      // Our standardized API response format will always have 'success' and either 'data' or 'error'
      // Added robustness: If 'success' key is missing but it's an object and no 'errors' key, assume success.
      if (rawJsonResponse.success !== undefined) { // Check if 'success' key explicitly exists
        if (rawJsonResponse.success) {
          return { success: true, data: rawJsonResponse.data };
        } else {
          // Handle Laravel's default validation errors if they somehow bypass the exception handler
          if (rawJsonResponse.errors) {
              return {
                  success: false,
                  error: {
                      message: rawJsonResponse.message || 'Validation failed',
                      code: 'VALIDATION_ERROR', // Use a generic code for client-side validation issues
                      details: rawJsonResponse.errors // Pass the detailed errors
                  }
              };
          }
          return { success: false, error: rawJsonResponse.error };
        }
      } else if (typeof rawJsonResponse === 'object' && rawJsonResponse !== null && !rawJsonResponse.error && !rawJsonResponse.errors) {
        // If 'success' key is not explicitly defined, but it's a valid object and no error/errors key,
        // assume it's a successful data payload (e.g., /user endpoint directly returning user object)
        return { success: true, data: rawJsonResponse };
      } else {
        // Fallback for unexpected structures, treat as a generic error
        return {
          success: false,
          error: {
            message: rawJsonResponse.message || 'An unexpected API response format was received.',
            code: 'UNEXPECTED_RESPONSE',
            details: rawJsonResponse // Include the raw response for debugging
          }
        };
      }
    } catch (error) {
      console.error('API request failed:', error); // Keep console.error for actual errors
      return {
        success: false,
        error: {
          message: 'Network error or server unreachable.',
          code: 'NETWORK_ERROR',
        },
      };
    }
  },
};

// Reusable Message Display Component
const FlashMessage = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-success' : 'bg-danger'; // Bootstrap colors
  const textColor = 'text-white';

  return (
    <div className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow ${bgColor} ${textColor}`} style={{ zIndex: 1050 }}> {/* Bootstrap classes */}
      <span>{message}</span>
      <button type="button" className="btn-close btn-close-white ms-3" aria-label="Close" onClick={onClose}></button> {/* Bootstrap close button */}
    </div>
  );
};

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
            showFlashMessage('Your session has expired. Please log in again.', 'error');
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

// ----------------------------------------------------------------------------------------------------
// MODULE 1.1: LOGIN
// ----------------------------------------------------------------------------------------------------

const LoginForm = ({ setCurrentPage }) => {
  const { setUser, setToken, showFlashMessage, redirectToDashboard } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email format is invalid.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const response = await apiService.request('/login', 'POST', { email, password });
    logDebug('LoginForm: /login API response (processed):', response); // DEBUG LOG
    setLoading(false);

    if (response.success) {
      localStorage.setItem('authToken', response.data.access_token);
      setToken(response.data.access_token); // This will cause App.js to re-render, but its useEffect won't re-fetch
      setUser(response.data.user); // This will cause App.js to re-render, but its useEffect won't re-fetch
      showFlashMessage('Login successful!', 'success');
      redirectToDashboard(response.data.user.role); // Navigate directly after login
      logDebug('LoginForm: Login successful, token and user set. Redirecting...'); // DEBUG LOG
    } else {
      setErrors(response.error.details || {}); // For validation errors
      showFlashMessage(response.error.message || 'Login failed. Please try again.', 'error');
      logDebug('LoginForm: Login failed. Error:', response.error); // DEBUG LOG
    }
  };

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}> {/* Bootstrap classes for card, shadow, rounded, padding, and custom max-width */}
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Login to Zenovation</h2> {/* Bootstrap classes */}
      <form onSubmit={handleSubmit}>
        <div className="mb-3"> {/* Bootstrap margin-bottom */}
          <label htmlFor="email" className="form-label">Email</label> {/* Bootstrap form-label */}
          <input
            className="form-control" // Bootstrap form-control
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <div className="text-danger small mt-1">{errors.email}</div>} {/* Bootstrap text-danger, small */}
        </div>
        <div className="mb-4"> {/* Bootstrap margin-bottom */}
          <label htmlFor="password" className="form-label">Password</label> {/* Bootstrap form-label */}
          <input
            className="form-control" // Bootstrap form-control
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <div className="text-danger small mt-1">{errors.password}</div>} {/* Bootstrap text-danger, small */}
        </div>
        <div className="d-grid mb-4"> {/* Bootstrap d-grid for full-width button */}
          <button
            className="btn btn-primary btn-lg" // Bootstrap button classes
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>
        <div className="text-center">
          <a
            className="text-primary fw-bold text-decoration-none" // Bootstrap classes
            href="#"
            onClick={() => setCurrentPage({ name: 'forgot-password', data: null })}
          >
            Forgot Password?
          </a>
        </div>
      </form>
    </div>
  );
};

// ----------------------------------------------------------------------------------------------------
// MODULE 1.2: FORGOT PASSWORD (OTP via Email)
// ----------------------------------------------------------------------------------------------------

const ForgotPasswordForm = ({ setCurrentPage }) => {
  const { showFlashMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false); // To track if OTP was sent successfully

  const validateEmail = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email format is invalid.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setLoading(true);
    const response = await apiService.request('/forgot-password', 'POST', { email });
    setLoading(false);

    if (response.success) {
      showFlashMessage(response.data.message || 'OTP sent successfully!', 'success');
      setOtpSent(true); // Indicate OTP was sent
      setCurrentPage({ name: 'verify-otp', data: { email } }); // Pass email as data
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'Failed to send OTP. Please try again.', 'error');
    }
  };

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}> {/* Bootstrap classes */}
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Forgot Password</h2> {/* Bootstrap classes */}
      {!otpSent ? (
        <form onSubmit={handleRequestOtp}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Registered Email</label>
            <input
              className="form-control"
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
          </div>
          <div className="d-grid mb-4">
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Request OTP'}
            </button>
          </div>
          <div className="text-center">
            <a
              className="text-primary fw-bold text-decoration-none"
              href="#"
              onClick={() => setCurrentPage({ name: 'login', data: null })}
            >
              Back to Login
            </a>
          </div>
        </form>
      ) : (
        <p className="text-center text-secondary">
          OTP sent to {email}. Please check your inbox and proceed to verification.
        </p>
      )}
    </div>
  );
};

const OTPVerificationForm = ({ setCurrentPage, initialData }) => { // Added initialData prop
  const { showFlashMessage } = useAuth();
  const [email] = useState(initialData?.email || ''); // Initialize email from initialData, make it read-only
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!email && initialData?.email) {
    }
  }, [email, initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!otp) newErrors.otp = 'OTP is required.';
    else if (!/^\d{6}$/.test(otp)) newErrors.otp = 'OTP must be a 6-digit number.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const response = await apiService.request('/verify-otp', 'POST', { email, otp });
    setLoading(false);

    if (response.success) {
      showFlashMessage(response.data.message || 'OTP verified successfully!', 'success');
      setCurrentPage({ name: 'reset-password', data: { email, otp } }); // Pass email and OTP as data
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'OTP verification failed. Please try again.', 'error');
    }
  };

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}> {/* Bootstrap classes */}
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Verify OTP</h2> {/* Bootstrap classes */}
      <form onSubmit={handleVerifyOtp}>
        <p className="text-secondary small mb-3">
          OTP sent to: <span className="fw-semibold">{email || 'your email'}</span>
        </p>
        <div className="mb-4">
          <label htmlFor="otp" className="form-label">OTP</label>
          <input
            className="form-control"
            id="otp"
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
          />
          {errors.otp && <div className="text-danger small mt-1">{errors.otp}</div>}
        </div>
        <div className="d-grid mb-4">
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
        <div className="text-center">
          <a
            className="text-primary fw-bold text-decoration-none"
            href="#"
            onClick={() => setCurrentPage({ name: 'forgot-password', data: null })}
          >
            Resend OTP / Back
          </a>
        </div>
      </form>
    </div>
  );
};

const ResetPasswordForm = ({ setCurrentPage, initialData }) => { // Added initialData prop
  const { showFlashMessage } = useAuth();
  const [email, setEmail] = useState(initialData?.email || '');
  const [otp, setOtp] = useState(initialData?.otp || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setEmail(initialData.email);
      setOtp(initialData.otp);
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required.';
    if (!otp) newErrors.otp = 'OTP is required.';
    if (!password) newErrors.password = 'New password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== passwordConfirmation) newErrors.passwordConfirmation = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        return;
    }

    setLoading(true);
    const response = await apiService.request('/reset-password', 'POST', {
      email,
      otp,
      password: password,
      password_confirmation: passwordConfirmation,
    });
    setLoading(false);

    if (response.success) {
      showFlashMessage(response.data.message || 'Password updated successfully!', 'success');
      setCurrentPage({ name: 'login', data: null });
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'Password reset failed. Please try again.', 'error');
    }
  };

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}> {/* Bootstrap classes */}
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Reset Password</h2> {/* Bootstrap classes */}
      <form onSubmit={handleResetPassword}>
        <input type="hidden" value={email} />
        <input type="hidden" value={otp} />

        <div className="mb-3">
          <label htmlFor="password" className="form-label">New Password</label>
          <input
            className="form-control"
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="passwordConfirmation" className="form-label">Confirm New Password</label>
          <input
            className="form-control"
            id="passwordConfirmation"
            type="password"
            placeholder="********"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          {errors.passwordConfirmation && <div className="text-danger small mt-1">{errors.passwordConfirmation}</div>}
        </div>
        <div className="d-grid mb-4">
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
        <div className="text-center">
          <a
            className="text-primary fw-bold text-decoration-none"
            href="#"
            onClick={() => setCurrentPage({ name: 'login', data: null })}
          >
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
};

// ----------------------------------------------------------------------------------------------------
// MODULE 1.3: RESET PASSWORD (From Profile)
// ----------------------------------------------------------------------------------------------------

const ProfileSettings = ({ setCurrentPage }) => {
  const { user, token, setToken, showFlashMessage } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!currentPassword) newErrors.currentPassword = 'Current password is required.';
    if (!newPassword) newErrors.newPassword = 'New password is required.';
    else if (newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters.';
    // Added validation: New password cannot be the same as the current password
    if (newPassword && currentPassword && newPassword === currentPassword) {
      newErrors.newPassword = 'New password cannot be the same as the current password.';
    }
    if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = 'Passwords do not match.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    // Changed method from 'PUT' to 'POST'
    const response = await apiService.request('/profile/reset-password', 'POST', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: confirmNewPassword,
    }, token);
    setLoading(false);

    if (response.success) {
      showFlashMessage(response.data.message || 'Password updated successfully! Please log in again.', 'success');
      localStorage.removeItem('authToken'); // Clear token
      setToken(null); // Clear token in state
      setCurrentPage({ name: 'login', data: null }); // Update to object and redirect to login
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'Failed to update password. Please try again.', 'error');
    }
  };

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}> {/* Bootstrap classes */}
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Change Password</h2> {/* Bootstrap classes */}
      <form onSubmit={handleChangePassword}>
        <div className="mb-3">
          <label htmlFor="currentPassword" className="form-label">Current Password</label>
          <input
            className="form-control"
            id="currentPassword"
            type="password"
            placeholder="********"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {errors.currentPassword && <div className="text-danger small mt-1">{errors.currentPassword}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="newPasswordProfile" className="form-label">New Password</label>
          <input
            className="form-control"
            id="newPasswordProfile"
            type="password"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {errors.newPassword && <div className="text-danger small mt-1">{errors.newPassword}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="confirmNewPasswordProfile" className="form-label">Confirm New Password</label>
          <input
            className="form-control"
            id="confirmNewPasswordProfile"
            type="password"
            placeholder="********"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          {errors.confirmNewPassword && <div className="text-danger small mt-1">{errors.confirmNewPassword}</div>}
        </div>
        <div className="d-grid mb-4">
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </div>
        <div className="text-center">
          <a
            className="text-primary fw-bold text-decoration-none"
            href="#"
            onClick={() => setCurrentPage({ name: 'dashboard', data: null })}
          >
            Back to Dashboard
          </a>
        </div>
      </form>
    </div>
  );
};

// ----------------------------------------------------------------------------------------------------
// DASHBOARD (Placeholder for Role-Based Redirection)
// ----------------------------------------------------------------------------------------------------

const Dashboard = ({ setCurrentPage }) => {
  const { user, setToken, setUser, showFlashMessage } = useAuth();

  // DEBUG LOG: Log the user object and its role when the Dashboard component renders
  logDebug('Dashboard Component: User object:', user);
  logDebug('Dashboard Component: User role:', user?.role);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    showFlashMessage('Logged out successfully.', 'success');
    setCurrentPage({ name: 'login', data: null });
  };

  if (!user) {
    return <div className="text-danger">User data not available. Please log in.</div>;
  }

  // Basic dashboard structure based on user role
  let dashboardContent;
  switch (user.role) {
    case 'super_admin':
      dashboardContent = (
        <div>
          <h3 className="fs-5 fw-semibold mb-3">Super Admin Dashboard</h3>
          <p>Welcome, Super Admin {user.name || user.email}!</p>
          <ul className="list-unstyled mt-3"> {/* Bootstrap list-unstyled */}
            <li>System Overview</li>
            <li>User Management</li>
            <li>School Management</li>
          </ul>
        </div>
      );
      break;
    case 'school_admin':
      dashboardContent = (
        <div>
          <h3 className="fs-5 fw-semibold mb-3">School Admin Dashboard</h3>
          <p>Welcome, School Admin {user.name || user.email}!</p>
          <ul className="list-unstyled mt-3">
            <li>School Overview</li>
            <li>Teacher Management</li>
            <li>Student Management</li>
          </ul>
        </div>
      );
      break;
    case 'hod':
      dashboardContent = (
        <div>
          <h3 className="fs-5 fw-semibold mb-3">HOD Dashboard</h3>
          <p>Welcome, HOD {user.name || user.email}!</p>
          <ul className="list-unstyled mt-3">
            <li>Department Overview</li>
            <li>Faculty Management</li>
            <li>Course Management</li>
          </ul>
        </div>
      );
      break;
    case 'teacher':
      dashboardContent = (
        <div>
          <h3 className="fs-5 fw-semibold mb-3">Teacher Dashboard</h3>
          <p>Welcome, Teacher {user.name || user.email}!</p>
          <ul className="list-unstyled mt-3">
            <li>My Classes</li>
            <li>Student Attendance</li>
            <li>Grades & Assessments</li>
          </ul>
        </div>
      );
      break;
    case 'student':
      dashboardContent = (
        <div>
          <h3 className="fs-5 fw-semibold mb-3">Student Dashboard</h3>
          <p>Welcome, Student {user.name || user.email}!</p>
          <ul className="list-unstyled mt-3">
            <li>My Classes</li>
            <li>Attendance</li>
            <li>Grades</li>
          </ul>
        </div>
      );
      break;
    default:
      dashboardContent = <p>Unknown role. Please contact support.</p>;
      break;
  }

  return (
    <div className="card shadow rounded-3 p-4 p-md-5 text-secondary" style={{ maxWidth: '40rem', width: '100%' }}> {/* Bootstrap classes and custom max-width */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="card-title fs-4 fw-bold">Dashboard</h2>
        <div className="d-flex gap-3"> {/* Bootstrap gap utility */}
            <button
                onClick={() => setCurrentPage({ name: 'profile-settings', data: null })}
                className="btn btn-secondary"
            >
                Profile Settings
            </button>
            <button
                onClick={handleLogout}
                className="btn btn-danger"
            >
                Logout
            </button>
        </div>
      </div>
      {dashboardContent}
    </div>
  );
};
