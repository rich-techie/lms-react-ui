// src/pages/Auth/ResetPasswordForm.jsx

import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import apiService from '../../services/apiService';

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
      showFlashMessage(response.error.message || 'Password reset failed. Please try again.', 'danger');
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

export default ResetPasswordForm;
