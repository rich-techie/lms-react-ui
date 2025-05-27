// src/pages/Auth/ForgotPasswordForm.jsx

import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import apiService from '../../services/apiService';
import { logDebug } from '../../utils/debugLogger';

const ForgotPasswordForm = ({ setCurrentPage }) => {
  const { showFlashMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false); // To track if OTP was sent successfully

  // Log errors state whenever it changes via useEffect
  useEffect(() => {
    logDebug('ForgotPasswordForm useEffect: errors state updated to:', errors);
  }, [errors]);

  const validateEmail = () => {
    logDebug('--- Inside validateEmail function ---');
    logDebug('validateEmail: Current email state received:', email);

    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (email === 'debug-invalid-email') { // Explicitly set error for this test string
      logDebug('validateEmail: Matched "debug-invalid-email", GUARANTEEING error setting.');
      newErrors.email = 'Email format is invalid.';
    } else if (!/\S+@\S+\.\S+/.test(email)) { // General regex for other cases, if 'debug-invalid-email' isn't matched
      logDebug('validateEmail: Regex failed for email (non-debug):', email);
      newErrors.email = 'Email format is invalid.';
    }

    logDebug('validateEmail: Calculated newErrors (before setErrors call):', newErrors);
    setErrors(newErrors); // This is the call that should trigger a re-render with new errors
    // Note: 'errors' here (from closure) will reflect the state *before* this setErrors call.
    // The useEffect above will show the state *after* the re-render.
    logDebug('validateEmail: Called setErrors. (errors state in this closure, might be stale):', errors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    logDebug('handleRequestOtp: Form submission initiated. Email:', email); // Log at entry point
    if (!validateEmail()) { // Call validateEmail
      logDebug('handleRequestOtp: Client-side validation failed. Not calling API.');
      return;
    }
    logDebug('handleRequestOtp: Client-side validation passed. Calling API...');

    setLoading(true);
    const response = await apiService.request('/forgot-password', 'POST', { email });
    setLoading(false);

    if (response.success) {
      showFlashMessage(response.data.message || 'OTP sent successfully!', 'success');
      setOtpSent(true); // Indicate OTP was sent
      setCurrentPage({ name: 'verify-otp', data: { email } }); // Pass email as data
    } else {
      setErrors(response.error.details || {}); // This would set errors from API
      showFlashMessage(response.error.message || 'Failed to send OTP. Please try again.', 'danger');
    }
  };

  logDebug('ForgotPasswordForm render cycle: Current email:', email, 'Current errors (from render):', errors);

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}> {/* Bootstrap classes */}
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Forgot Password</h2> {/* Bootstrap classes */}
      {!otpSent ? (
        <form onSubmit={handleRequestOtp} aria-label="Forgot Password Form"> {/* ADDED aria-label */}
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

export default ForgotPasswordForm;
