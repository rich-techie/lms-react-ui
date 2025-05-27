// src/pages/Dashboard/Dashboard.jsx

import React from 'react';
import useAuth from '../../hooks/useAuth';
import { logDebug } from '../../utils/debugLogger';

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

export default Dashboard;
