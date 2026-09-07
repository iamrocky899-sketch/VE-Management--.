import React from 'react';
import { useAuth } from '../state/AuthContext';
import Unauthorized from './Unauthorized';

export default function ProtectedRoute({ children, allowedRoles, onNavigate }) {
  const { user, role, isAuthenticated, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: '#94a3b8' }}>
          Verifying Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = (role || user.role || '').toUpperCase();
    const isAllowed = allowedRoles.map(r => r.toUpperCase()).includes(currentRole);

    if (!isAllowed) {
      return <Unauthorized onNavigate={onNavigate} userRole={currentRole} />;
    }
  }

  return children;
}
