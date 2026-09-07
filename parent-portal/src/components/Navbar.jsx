import React from 'react';
import { useAuth } from '../state/AuthContext';
import { LogOut, Globe, School, User, KeyRound, Bell } from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenChangePassword }) {
  const { isAuthenticated, logout, user, isStudent, isParent } = useAuth();

  return (
    <header className="navbar">
      <div
        className="nav-brand"
        onClick={() => setActivePage('dashboard')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
      >
        <div className="brand-icon">
          <School size={22} />
        </div>
        <div>
          <div className="brand-title">VE Management</div>
          <div className="brand-subtitle">Gameri Higher Secondary School</div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="desktop-nav-tabs">
          <button
            className={`desktop-tab ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            Home
          </button>
          <button
            className={`desktop-tab ${activePage === 'attendance' ? 'active' : ''}`}
            onClick={() => setActivePage('attendance')}
          >
            Attendance
          </button>
          <button
            className={`desktop-tab ${activePage === 'marks' ? 'active' : ''}`}
            onClick={() => setActivePage('marks')}
          >
            Marks
          </button>
          <button
            className={`desktop-tab ${activePage === 'activities' ? 'active' : ''}`}
            onClick={() => setActivePage('activities')}
          >
            Activities
          </button>
          <button
            className={`desktop-tab ${activePage === 'notices' ? 'active' : ''}`}
            onClick={() => setActivePage('notices')}
          >
            Notices
          </button>
          <button
            className={`desktop-tab ${activePage === 'calendar' ? 'active' : ''}`}
            onClick={() => setActivePage('calendar')}
          >
            Calendar
          </button>
          <button
            className={`desktop-tab ${activePage === 'profile' ? 'active' : ''}`}
            onClick={() => setActivePage('profile')}
          >
            Profile
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isAuthenticated && (
          <div className="role-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', background: isStudent ? '#eff6ff' : '#f0fdf4', color: isStudent ? '#1e40af' : '#166534', fontSize: '0.75rem', fontWeight: 700 }}>
            <User size={12} />
            <span>{isStudent ? 'STUDENT' : isParent ? 'PARENT' : user?.role}</span>
          </div>
        )}

        {isAuthenticated && onOpenChangePassword && (
          <button
            type="button"
            onClick={onOpenChangePassword}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            title="Change Password"
            aria-label="Change Password"
          >
            <KeyRound size={14} />
          </button>
        )}

        {isAuthenticated && (
          <button
            type="button"
            onClick={logout}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#dc2626' }}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </header>
  );
}
