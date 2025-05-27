// App.js - Main Application Component
// This is the root component that will handle routing and context for authentication.
// It will conditionally render components based on authentication state and user role.

import React, { useState, useEffect, createContext, useContext } from 'react';

// Create a context for authentication state and user data
const AuthContext = createContext(null);

// Custom Hook for Auth Context
const useAuth = () => useContext(AuthContext);

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
      console.log(`API Service: Raw response for ${endpoint}:`, rawJsonResponse); // DEBUG LOG

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
      console.error('API request failed:', error);
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

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const textColor = 'text-white';

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${bgColor} ${textColor} z-50 flex items-center justify-between`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold text-lg leading-none">&times;</button>
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
      console.log('App.js useEffect: Checking auth. Current token:', token); // DEBUG LOG
      if (token) { // This `token` is from localStorage.getItem('authToken')
        const response = await apiService.request('/user', 'GET', null, token);
        console.log('App.js useEffect: /user API response (processed):', response); // DEBUG LOG - Renamed for clarity
        if (response.success) {
          setUser(response.data);
          redirectToDashboard(response.data.user.role);
        } else {
          // Token invalid or expired
          console.log('App.js useEffect: Token invalid or expired, redirecting to login. Error:', response.error); // DEBUG LOG
          setToken(null);
          localStorage.removeItem('authToken');
          showFlashMessage('Your session has expired. Please log in again.', 'error');
          setCurrentPage({ name: 'login', data: null }); // Update to object
        }
      } else {
        console.log('App.js useEffect: No token found, redirecting to login.'); // DEBUG LOG
        setCurrentPage({ name: 'login', data: null }); // Update to object
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]); // Rerun if token changes

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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Application...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 h-full w-full">
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
    console.log('LoginForm: /login API response (processed):', response); // DEBUG LOG
    setLoading(false);

    if (response.success) {
      localStorage.setItem('authToken', response.data.access_token);
      setToken(response.data.access_token);
      setUser(response.data.user);
      showFlashMessage('Login successful!', 'success');
      redirectToDashboard(response.data.user.role);
      console.log('LoginForm: Login successful, token and user set. Redirecting...'); // DEBUG LOG
    } else {
      setErrors(response.error.details || {}); // For validation errors
      showFlashMessage(response.error.message || 'Login failed. Please try again.', 'error');
      console.log('LoginForm: Login failed. Error:', response.error); // DEBUG LOG
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login to Zenovation</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-red-500 text-xs italic mt-1">{errors.password}</p>}
        </div>
        <div className="flex items-center justify-between mb-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>
        <div className="text-center text-sm">
          <a
            className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
            href="#"
            onClick={() => setCurrentPage({ name: 'forgot-password', data: null })} // Update to object
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
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>
      {!otpSent ? (
        <form onSubmit={handleRequestOtp}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Registered Email
            </label>
            <input
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-red-500 text-xs italic mt-1">{errors.email}</p>}
          </div>
          <div className="flex items-center justify-between mb-6">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Request OTP'}
            </button>
          </div>
          <div className="text-center text-sm">
            <a
              className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
              href="#"
              onClick={() => setCurrentPage({ name: 'login', data: null })} // Update to object
            >
              Back to Login
            </a>
          </div>
        </form>
      ) : (
        <p className="text-center text-gray-700">
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
    if (!email && initialData?.email) { // Ensure email is set if initialData is provided
      // This effect is mostly for initial load, but email is now read-only
      // If the component is remounted without initialData, email might be empty
      // For this flow, we assume email is always passed from ForgotPasswordForm
    }
  }, [email, initialData]);

  const validateForm = () => {
    const newErrors = {};
    // No email validation here as it's passed from previous step
    if (!otp) newErrors.otp = 'OTP is required.';
    else if (!/^\d{6}$/.test(otp)) newErrors.otp = 'OTP must be a 6-digit number.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // console.log('Verifying OTP for:', email, otp); // Debugging
    setLoading(true);
    const response = await apiService.request('/verify-otp', 'POST', { email, otp });
    setLoading(false);
    // console.log('Verify OTP Response:', response); // Debugging

    if (response.success) {
      showFlashMessage(response.data.message || 'OTP verified successfully!', 'success');
      setCurrentPage({ name: 'reset-password', data: { email, otp } }); // Pass email and OTP as data
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'OTP verification failed. Please try again.', 'error');
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Verify OTP</h2>
      <form onSubmit={handleVerifyOtp}>
        {/* Email field removed, but email is still in state for API request */}
        <p className="text-gray-700 text-sm mb-4">
          OTP sent to: <span className="font-semibold">{email || 'your email'}</span>
        </p>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">
            OTP
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="otp"
            type="text"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
          />
          {errors.otp && <p className="text-red-500 text-xs italic mt-1">{errors.otp}</p>}
        </div>
        <div className="flex items-center justify-between mb-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
        <div className="text-center text-sm">
          <a
            className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
            href="#"
            onClick={() => setCurrentPage({ name: 'forgot-password', data: null })} // Update to object
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
  const [password, setPassword] = useState(''); // Changed from newPassword
  const [passwordConfirmation, setPasswordConfirmation] = useState(''); // Changed from confirmPassword
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // console.log('ResetPasswordForm initialData:', initialData); // Debugging
    if (initialData) {
      setEmail(initialData.email);
      setOtp(initialData.otp);
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required.'; // Keep validation for robustness
    if (!otp) newErrors.otp = 'OTP is required.'; // Keep validation for robustness
    if (!password) newErrors.password = 'New password is required.'; // Changed from newPassword
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.'; // Changed from newPassword
    if (password !== passwordConfirmation) newErrors.passwordConfirmation = 'Passwords do not match.'; // Changed from confirmPassword
    setErrors(newErrors);
    // console.log('Validation Errors:', newErrors); // Debugging
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    // console.log('Reset Password button clicked'); // Debugging
    if (!validateForm()) {
        // console.log('Form validation failed.'); // Debugging
        return;
    }

    setLoading(true);
    const response = await apiService.request('/reset-password', 'POST', {
      email,
      otp,
      password: password, // Changed from new_password
      password_confirmation: passwordConfirmation, // Changed from confirm_password
    });
    setLoading(false);
    // console.log('Reset Password Response:', response); // Debugging

    if (response.success) {
      showFlashMessage(response.data.message || 'Password updated successfully!', 'success');
      setCurrentPage({ name: 'login', data: null }); // Update to object
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'Password reset failed. Please try again.', 'error');
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Reset Password</h2>
      <form onSubmit={handleResetPassword}>
        {/* Email and OTP fields are now hidden/read-only as they are passed via state */}
        <input type="hidden" value={email} />
        <input type="hidden" value={otp} />

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password"> {/* Changed htmlFor */}
            New Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-red-500 text-xs italic mt-1">{errors.password}</p>} {/* Changed errors.newPassword */}
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="passwordConfirmation"> {/* Changed htmlFor */}
            Confirm New Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="passwordConfirmation"
            type="password"
            placeholder="********"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          {errors.passwordConfirmation && <p className="text-red-500 text-xs italic mt-1">{errors.passwordConfirmation}</p>} {/* Changed errors.confirmPassword */}
        </div>
        <div className="flex items-center justify-between mb-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
        <div className="text-center text-sm">
          <a
            className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
            href="#"
            onClick={() => setCurrentPage({ name: 'login', data: null })} // Update to object
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
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Change Password</h2>
      <form onSubmit={handleChangePassword}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
            Current Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="currentPassword"
            type="password"
            placeholder="********"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {errors.currentPassword && <p className="text-red-500 text-xs italic mt-1">{errors.currentPassword}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPasswordProfile">
            New Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="newPasswordProfile"
            type="password"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {errors.newPassword && <p className="text-red-500 text-xs italic mt-1">{errors.newPassword}</p>}
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmNewPasswordProfile">
            Confirm New Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            id="confirmNewPasswordProfile"
            type="password"
            placeholder="********"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
          {errors.confirmNewPassword && <p className="text-red-500 text-xs italic mt-1">{errors.confirmNewPassword}</p>}
        </div>
        <div className="flex items-center justify-between mb-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 ease-in-out w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </div>
        <div className="text-center text-sm">
          <a
            className="font-bold text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out"
            href="#"
            onClick={() => setCurrentPage({ name: 'dashboard', data: null })} // Update to object
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    showFlashMessage('Logged out successfully.', 'success');
    setCurrentPage({ name: 'login', data: null }); // Update to object
  };

  if (!user) {
    return <div className="text-red-500">User data not available. Please log in.</div>;
  }

  // Basic dashboard structure based on user role
  let dashboardContent;
  switch (user.role) {
    case 'super_admin':
      dashboardContent = (
        <div>
          <h3 className="text-xl font-semibold mb-4">Super Admin Dashboard</h3>
          <p>Welcome, Super Admin {user.name || user.email}!</p>
          <ul className="list-disc list-inside mt-4">
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
          <h3 className="text-xl font-semibold mb-4">School Admin Dashboard</h3>
          <p>Welcome, School Admin {user.name || user.email}!</p>
          <ul className="list-disc list-inside mt-4">
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
          <h3 className="text-xl font-semibold mb-4">HOD Dashboard</h3>
          <p>Welcome, HOD {user.name || user.email}!</p>
          <ul className="list-disc list-inside mt-4">
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
          <h3 className="text-xl font-semibold mb-4">Teacher Dashboard</h3>
          <p>Welcome, Teacher {user.name || user.email}!</p>
          <ul className="list-disc list-inside mt-4">
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
          <h3 className="text-xl font-semibold mb-4">Student Dashboard</h3>
          <p>Welcome, Student {user.name || user.email}!</p>
          <ul className="list-disc list-inside mt-4">
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
    <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-lg text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex space-x-4">
            <button
                onClick={() => setCurrentPage({ name: 'profile-settings', data: null })} // Update to object
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
            >
                Profile Settings
            </button>
            <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out"
            >
                Logout
            </button>
        </div>
      </div>
      {dashboardContent}
    </div>
  );
};

