import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized({ onBackToDashboard, message }) {
  return (
    <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--danger-50)', color: 'var(--danger-500)', borderRadius: '50%', marginBottom: '16px' }}>
        <ShieldAlert size={48} />
      </div>
      <h2 className="card-title" style={{ fontSize: '1.4rem' }}>Access Restricted (403)</h2>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
        {message || 'You do not have permission to view or manage this module. This section requires Principal authority or specific role permissions.'}
      </p>
      {onBackToDashboard && (
        <button
          className="btn-primary"
          style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Return to Staff Dashboard</span>
        </button>
      )}
    </div>
  );
}
