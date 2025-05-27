// src/pages/Profile/ProfileSettings.jsx

import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import apiService from '../../services/apiService';

const ProfileSettings = ({ setCurrentPage }) => {
  const { user, token, setToken, setUser, showFlashMessage } = useAuth(); // Destructure setUser
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
      setUser(null); // Clear user in state - ADDED THIS LINE
      setCurrentPage({ name: 'login', data: null }); // Update to object and redirect to login
    } else {
      setErrors(response.error.details || {});
      showFlashMessage(response.error.message || 'Failed to update password. Please try again.', 'danger');
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

export default ProfileSettings;
