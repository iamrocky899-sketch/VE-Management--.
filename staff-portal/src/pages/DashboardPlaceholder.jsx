import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Calendar, BookOpen, Users, Bell, CheckCircle2 } from 'lucide-react';

export default function DashboardPlaceholder() {
  const { user, isTeacher, isPrincipal } = useAuth();

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e40af, #1d4ed8)', color: 'white', border: 'none', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          <Sparkles size={16} />
          <span>Staff Workspace Initialized</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>Welcome back, {user?.name}!</h1>
        <p style={{ color: '#dbeafe', fontSize: '0.95rem' }}>
          {isPrincipal
            ? 'Principal Academic Oversight & School-Wide Management'
            : `Vocational Teacher Workspace — Assigned Classes: ${user?.assignedClasses?.join(', ') || '9, 10'} (${user?.assignedSubjects?.join(', ') || 'IT/ITeS'})`}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '12px' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>Active Role & Scope</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                {isPrincipal ? 'Principal (All Classes)' : `Teacher (${user?.assignedClasses?.length || 2} Classes)`}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            {isPrincipal
              ? 'Authorized for school-wide attendance, marks oversight, teacher roster, and circulars.'
              : `Strictly scoped to Class ${user?.assignedClasses?.join(' and ') || '9 and 10'} student records and ${user?.assignedSubjects?.join(', ') || 'IT/ITeS'} curriculum.`}
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: 'var(--success-50)', color: 'var(--success-500)', borderRadius: '12px' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>Session Authentication</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>HMAC-SHA256 Verified</div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            Session is securely stored in localStorage (<code style={{ background: 'var(--slate-100)', padding: '2px 6px', borderRadius: '4px' }}>itd3_staff_portal_session</code>) and persists across page reloads.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', background: '#fef3c7', color: '#b45309', borderRadius: '12px' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>Phase 5 Step 3 Shell</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>Ready for Step 4 Modules</div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            Authentication, role scoping, responsive navigation shell, and API clients are complete. Full dashboard KPI widgets will be connected in Step 4.
          </p>
        </div>
      </div>
    </div>
  );
}
