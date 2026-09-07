import React from 'react';
import { useAuth } from '../state/AuthContext';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = ['STUDENT', 'PARENT'], onNavigate }) {
  const { isAuthenticated, isCheckingSession, user, logout } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <div style={{ marginTop: '16px', fontWeight: 600, color: '#1e3a8a' }}>
          Checking session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will trigger login page in App.jsx
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="unauthorized-barrier">
        <div className="unauthorized-card card">
          <div className="unauthorized-icon-wrap">
            <ShieldAlert size={36} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
            This section is restricted to <strong>{allowedRoles.join(' / ')}</strong> accounts. Your current role is <strong>{user?.role}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {onNavigate && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onNavigate(user?.role === 'STUDENT' ? '/student' : '/parent')}
              >
                <ArrowLeft size={16} />
                <span>Go to Dashboard</span>
              </button>
            )}
            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', background: '#dc2626' }}
              onClick={logout}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
