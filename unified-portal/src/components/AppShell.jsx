import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { 
  GraduationCap, 
  Menu, 
  X, 
  LogOut, 
  User, 
  ShieldCheck, 
  Key, 
  ChevronDown,
  LayoutDashboard,
  CalendarCheck,
  Award,
  BookOpen,
  ClipboardList,
  Calendar,
  Users,
  Building2,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Sparkles
} from 'lucide-react';
import ChildSelector from './ChildSelector';
import ChangePasswordModal from './ChangePasswordModal';

export default function AppShell({ activePage, setActivePage, children }) {
  const { user, role, logout, isStudent, isParent, isTeacher, isPrincipal, isAdmin, isStaff } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Role-specific navigation items
  const getNavItems = () => {
    if (isStudent) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'marks', label: 'Marks', icon: Award },
        { id: 'notes', label: 'Notes', icon: BookOpen },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'activities', label: 'Activities', icon: Sparkles },
        { id: 'profile', label: 'Profile', icon: User }
      ];
    }

    if (isParent) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'marks', label: 'Marks', icon: Award },
        { id: 'notes', label: 'Notes', icon: BookOpen },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'activities', label: 'Activities', icon: Sparkles },
        { id: 'profile', label: 'Profile', icon: User }
      ];
    }

    if (isStaff) {
      const items = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'marks', label: 'Marks', icon: Award },
        { id: 'notes', label: 'Notes', icon: BookOpen },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'activities', label: 'Activities', icon: Sparkles },
        { id: 'classes', label: 'Classes', icon: Building2 },
        { id: 'calendar', label: 'Calendar', icon: Calendar }
      ];

      if (isPrincipal || isAdmin) {
        items.push({ id: 'teachers', label: 'Teachers', icon: Users });
        items.push({ id: 'reports', label: 'Reports', icon: BarChart3 });
        items.push({ id: 'academic-years', label: 'Academic Years', icon: Calendar });
        items.push({ id: 'settings', label: 'Settings', icon: Settings });
      }

      return items;
    }

    return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
  };

  const navItems = getNavItems();

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleBadge = () => {
    if (isAdmin) return <span className="badge badge-purple">Admin</span>;
    if (isPrincipal) return <span className="badge badge-purple">Principal</span>;
    if (isTeacher) return <span className="badge badge-blue">Teacher</span>;
    if (isParent) return <span className="badge badge-green">Parent</span>;
    return <span className="badge badge-cyan">Student</span>;
  };

  return (
    <div className="portal-shell">
      {/* Top Navbar */}
      <header className="portal-navbar">
        <div className="navbar-container">
          {/* Brand Identity */}
          <div className="navbar-brand" onClick={() => handleNavClick('dashboard')} style={{ cursor: 'pointer' }}>
            <div className="navbar-crest">
              <GraduationCap size={22} className="text-cyan-400" />
            </div>
            <div className="navbar-titles">
              <span className="navbar-title">VE MANAGEMENT</span>
              <span className="navbar-subtitle">Gameri Higher Secondary School</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="navbar-desktop-nav">
            {navItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-pill ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="navbar-actions">
            {/* User Dropdown Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="user-profile-btn"
              >
                <div className="user-avatar-circle">
                  {(user?.name || 'U').charAt(0)}
                </div>
                <div className="user-meta-desktop">
                  <span className="user-name-text">{user?.name || 'User'}</span>
                  {getRoleBadge()}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="user-dropdown-menu animate-fade-in" onClick={() => setIsUserMenuOpen(false)}>
                  <div className="dropdown-header">
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                      {user?.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {user?.mobile || user?.userId}
                    </p>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    <Key size={16} />
                    <span>Change Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="dropdown-item text-rose-400"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-toggle"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-drawer animate-fade-in">
            <div className="mobile-drawer-items">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`mobile-drawer-btn ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="dropdown-divider" style={{ margin: '8px 0' }} />
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="mobile-drawer-btn"
              >
                <Key size={18} />
                <span>Change Password</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="mobile-drawer-btn text-rose-400"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="portal-main-container">
        {/* Child Selector for Parent role */}
        {isParent && <ChildSelector />}

        {/* Render Active View */}
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="portal-bottom-nav">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
}
