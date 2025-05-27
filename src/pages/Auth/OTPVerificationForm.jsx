// src/pages/Auth/OTPVerificationForm.jsx

import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import apiService from '../../services/apiService';

const OTPVerificationForm = ({ setCurrentPage, initialData }) => { // Added initialData prop
  const { showFlashMessage } = useAuth();
  const [email] = useState(initialData?.email || ''); // Initialize email from initialData, make it read-only
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!email && initialData?.email) {
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

    setLoading(true);
    const response = await apiService.request('/verify-otp', 'POST', { email, otp });
    setLoading(false);

    if (response.success) {
      showFlashMessage(response.data.message || 'OTP verified successfully!', 'success');
      setCurrentPage({ name: 'reset-password', data: { email, otp } }); // Pass email and OTP as data
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'OTP verification failed. Please try again.', 'danger');
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

export default OTPVerificationForm;
