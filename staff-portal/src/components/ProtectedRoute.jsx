import React from 'react';
import { useAuth } from '../context/AuthContext';
import Unauthorized from './Unauthorized';

export default function ProtectedRoute({ children, allowedRoles, onNavigate }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null; // Will trigger login view in App.jsx
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <Unauthorized
          message={`Your role (${user.role}) is not authorized to access this module. This section requires ${allowedRoles.join(' or ')} permissions.`}
          onBackToDashboard={() => onNavigate && onNavigate('/dashboard')}
        />
      );
    }
  }

  return children;
}
