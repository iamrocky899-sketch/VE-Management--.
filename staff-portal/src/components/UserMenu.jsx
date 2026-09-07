import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, LogOut, KeyRound, User, BookOpen } from 'lucide-react';

export default function UserMenu() {
  const { user, logout, isTeacher, isPrincipal, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'ST';

  const roleLabel = isPrincipal ? 'Principal' : isTeacher ? 'Vocational Teacher' : isAdmin ? 'Administrator' : user.role;
  const roleClass = isPrincipal ? 'role-principal' : isTeacher ? 'role-teacher' : 'role-admin';

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        className="user-profile-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        <div className="user-avatar">{initials}</div>
        <div className="user-info-brief">
          <span className="user-name-text">{user.name}</span>
          <span className={`role-pill ${roleClass}`}>{roleLabel}</span>
        </div>
        <ChevronDown size={16} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <div style={{ fontWeight: 600, color: 'var(--slate-800)', fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{user.mobile || user.email || user.staffId}</div>

            {isTeacher && (
              <>
                <div className="dropdown-meta-label">Assigned Classes</div>
                <div className="dropdown-meta-val">
                  {user.assignedClasses && user.assignedClasses.length > 0 ? `Class ${user.assignedClasses.join(', ')}` : 'All Classes'}
                </div>

                <div className="dropdown-meta-label">Assigned Subjects</div>
                <div className="dropdown-meta-val">
                  {user.assignedSubjects && user.assignedSubjects.length > 0 ? user.assignedSubjects.join(', ') : 'IT/ITeS'}
                </div>
              </>
            )}

            {isPrincipal && (
              <>
                <div className="dropdown-meta-label">School Authority</div>
                <div className="dropdown-meta-val">School-Wide Academic Oversight</div>
              </>
            )}
          </div>

          <button
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              alert('Password Change modal will be available in Phase 5 profile settings.');
            }}
          >
            <KeyRound size={16} />
            <span>Change Password</span>
          </button>

          <button
            className="dropdown-item dropdown-item-danger"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
