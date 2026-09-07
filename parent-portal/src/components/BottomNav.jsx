import React from 'react';
import { useAuth } from '../state/AuthContext';
import { Home, CheckCircle2, Award, Calendar, User } from 'lucide-react';

export default function BottomNav({ activePage, setActivePage }) {
  const { isStudent } = useAuth();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActivePage('dashboard')}
        aria-label="Home Dashboard"
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activePage === 'attendance' ? 'active' : ''}`}
        onClick={() => setActivePage('attendance')}
        aria-label="Attendance Module"
      >
        <CheckCircle2 size={20} />
        <span>Attendance</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activePage === 'marks' ? 'active' : ''}`}
        onClick={() => setActivePage('marks')}
        aria-label="Marks Module"
      >
        <Award size={20} />
        <span>Marks</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activePage === 'calendar' ? 'active' : ''}`}
        onClick={() => setActivePage('calendar')}
        aria-label="Academic Calendar"
      >
        <Calendar size={20} />
        <span>Calendar</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
        onClick={() => setActivePage('profile')}
        aria-label="User Profile"
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
