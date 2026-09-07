import React from 'react';
import { Layers, ArrowLeft } from 'lucide-react';

export default function ModulePlaceholder({ title, description, onBack }) {
  return (
    <div className="card" style={{ padding: '36px', textAlign: 'center', maxWidth: '640px', margin: '20px auto' }}>
      <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', marginBottom: '16px' }}>
        <Layers size={36} />
      </div>
      <h2 className="card-title" style={{ fontSize: '1.35rem' }}>{title} Module</h2>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.925rem', marginBottom: '24px', lineHeight: 1.5 }}>
        {description || 'This module interface will be fully rendered in subsequent Phase 5 milestones. The backend APIs and role permissions are already verified and prepared.'}
      </p>
      {onBack && (
        <button
          className="btn-primary"
          style={{ width: 'auto', display: 'inline-flex', padding: '0 20px', margin: '0 auto' }}
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      )}
    </div>
  );
}
