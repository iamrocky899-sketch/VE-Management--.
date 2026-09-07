import React from 'react';
import { useAuth } from '../state/AuthContext';
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'classes', label: 'Classes', icon: School },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'documents', label: 'Academic Documents', icon: FileText },
    { id: 'portfolio', label: 'Student 360°', icon: UserCheck },
    { id: 'notes', label: 'Notes & Units', icon: BookOpen },
    { id: 'activities', label: 'Activities', icon: Briefcase },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const principalNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'All Students', icon: Users },
    { id: 'classes', label: 'Classes', icon: School },
    { id: 'academic-years', label: 'Academic Years', icon: Calendar },
    { id: 'attendance', label: 'School Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Academic Marks', icon: Award },
    { id: 'documents', label: 'Academic Documents', icon: FileText },
    { id: 'teachers', label: 'Teachers & Staff', icon: UserCheck },
    { id: 'notices', label: 'Notices & Circulars', icon: Bell },
    { id: 'activities', label: 'Activities', icon: Briefcase },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'calendar', label: 'ASSEB Calendar', icon: Calendar },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Institutional Settings', icon: SettingsIcon }
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
            const isActive = currentPath === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
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
