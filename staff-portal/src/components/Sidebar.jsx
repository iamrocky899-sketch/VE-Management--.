import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  FileText,
  Briefcase,
  CheckSquare,
  Bell,
  Calendar,
  BarChart3,
  UserCheck,
  School,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';

export default function Sidebar({ currentPath, onNavigate, mobileOpen, onCloseMobile }) {
  const { user, logout, isTeacher, isPrincipal, isAdmin } = useAuth();

  const teacherNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'students', label: 'Students', icon: Users, path: '/students' },
    { id: 'classes', label: 'Classes', icon: School, path: '/classes' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
    { id: 'marks', label: 'Marks', icon: Award, path: '/marks' },
    { id: 'documents', label: 'Academic Documents', icon: FileText, path: '/documents' },
    { id: 'portfolio', label: 'Student 360°', icon: UserCheck, path: '/portfolio' },
    { id: 'notes', label: 'Notes & Units', icon: BookOpen, path: '/notes' },
    { id: 'activities', label: 'Activities', icon: Briefcase, path: '/activities' },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare, path: '/assignments' },
    { id: 'notices', label: 'Notices', icon: Bell, path: '/notices' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
    { id: 'profile', label: 'Profile', icon: GraduationCap, path: '/profile' }
  ];

  const principalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'students', label: 'All Students', icon: Users, path: '/students' },
    { id: 'classes', label: 'Classes', icon: School, path: '/classes' },
    { id: 'academic-years', label: 'Academic Years', icon: Calendar, path: '/academic-years' },
    { id: 'attendance', label: 'School Attendance', icon: CalendarCheck, path: '/attendance' },
    { id: 'marks', label: 'Academic Marks', icon: Award, path: '/marks' },
    { id: 'documents', label: 'Academic Documents', icon: FileText, path: '/documents' },
    { id: 'teachers', label: 'Teachers & Staff', icon: UserCheck, path: '/teachers' },
    { id: 'notices', label: 'Notices & Circulars', icon: Bell, path: '/notices' },
    { id: 'activities', label: 'Activities', icon: Briefcase, path: '/activities' },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare, path: '/assignments' },
    { id: 'calendar', label: 'ASSEB Calendar', icon: Calendar, path: '/calendar' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
    { id: 'settings', label: 'Institutional Settings', icon: SettingsIcon, path: '/settings' },
    { id: 'profile', label: 'Profile', icon: GraduationCap, path: '/profile' }
  ];

  const navItems = isPrincipal ? principalNavItems : teacherNavItems;

  return (
    <>
      {mobileOpen && <div className="mobile-nav-overlay" onClick={onCloseMobile} />}

      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <GraduationCap size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="sidebar-brand-name">Gameri HSS</div>
            <div className="sidebar-brand-sub">Staff Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === '/dashboard' && currentPath === '/');
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.path);
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            style={{ color: 'var(--danger-500)' }}
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
