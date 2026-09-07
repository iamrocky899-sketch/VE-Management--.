import React from 'react';
import { Smartphone, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminNotice() {
  const { user, logout } = useAuth();

  return (
    <div className="card" style={{ maxWidth: '640px', margin: '40px auto', padding: '36px', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', padding: '16px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '50%', marginBottom: '16px' }}>
        <Smartphone size={44} />
      </div>
      <h2 className="card-title" style={{ fontSize: '1.4rem' }}>Administrator Account Detected</h2>
      <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.5 }}>
        Hello <strong>{user?.name}</strong>. Full administrative functions (such as system configuration, schema management, biometric face database sync, and comprehensive school controls) are located in the <strong>VE Management Android Administration Application</strong>.
      </p>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '28px' }}>
        The Web Staff Portal is designed specifically for teachers and principals to manage daily classroom records and academic circulars.
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '0 24px', background: 'var(--slate-800)' }}
          onClick={logout}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
