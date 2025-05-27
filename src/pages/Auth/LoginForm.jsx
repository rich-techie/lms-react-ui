// src/pages/Auth/LoginForm.jsx

import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import apiService from '../../services/apiService';
import { logDebug } from '../../utils/debugLogger';

const LoginForm = ({ setCurrentPage }) => {
  const { setUser, setToken, showFlashMessage, redirectToDashboard } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required.';
    // Consistent regex:
    else if (!/.+@.+\..+/.test(email)) newErrors.email = 'Email format is invalid.';
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
      setToken(response.data.access_token);
      setUser(response.data.user);
      showFlashMessage('Login successful!', 'success');
      redirectToDashboard(response.data.user.role);
      logDebug('LoginForm: Login successful, token and user set. Redirecting...'); // DEBUG LOG
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'Login failed. Please try again.', 'danger');
      logDebug('LoginForm: Login failed. Error:', response.error); // DEBUG LOG
    }
  };

  return (
    <div className="card shadow rounded-3 p-4 p-md-5" style={{ maxWidth: '28rem', width: '100%' }}>
      <h2 className="card-title text-center mb-4 fs-4 fw-bold">Login to Zenovation</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            className="form-control"
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">Password</label>
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
        <div className="d-grid mb-4">
          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </div>
        <div className="text-center">
          <a
            className="text-primary fw-bold text-decoration-none"
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

export default LoginForm;
