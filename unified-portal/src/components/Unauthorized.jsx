import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized({ onNavigate, userRole }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(244, 63, 94, 0.15)',
        color: '#f43f5e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        <ShieldAlert size={32} />
      </div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
        Access Restricted
      </h2>
      <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '24px' }}>
        Your account ({userRole || 'User'}) does not have permission to view this module.
      </p>
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>
      )}
    </div>
  );
}
