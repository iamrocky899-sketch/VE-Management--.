import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from './state/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import PortalShell from './components/PortalShell';

// Eager initial dashboards
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));

// Lazy-loaded secondary pages for maximum bundle efficiency & instant login render
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const ParentAttendance = lazy(() => import('./pages/ParentAttendance'));
const StudentMarks = lazy(() => import('./pages/StudentMarks'));
const ParentMarks = lazy(() => import('./pages/ParentMarks'));
const StudentMaterials = lazy(() => import('./pages/StudentMaterials'));
const ParentMaterials = lazy(() => import('./pages/ParentMaterials'));
const StudentActivities = lazy(() => import('./pages/StudentActivities'));
const ParentActivities = lazy(() => import('./pages/ParentActivities'));
const StudentAssignments = lazy(() => import('./pages/StudentAssignments'));
const ParentAssignments = lazy(() => import('./pages/ParentAssignments'));
const StudentNotices = lazy(() => import('./pages/StudentNotices'));
const ParentNotices = lazy(() => import('./pages/ParentNotices'));
const StudentCalendar = lazy(() => import('./pages/StudentCalendar'));
const ParentCalendar = lazy(() => import('./pages/ParentCalendar'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const ParentProfile = lazy(() => import('./pages/ParentProfile'));
const StudentContacts = lazy(() => import('./pages/StudentContacts'));
const ParentContacts = lazy(() => import('./pages/ParentContacts'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));

function PageFallback() {
  return (
    <div className="animate-fade-in" style={{ padding: '20px 0' }}>
      <div className="card skeleton" style={{ height: '120px', marginBottom: '16px', borderRadius: '16px' }} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '16px' }}>
        <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
        <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
        <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
      </div>
      <div className="card skeleton" style={{ height: '280px', borderRadius: '16px' }} />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isCheckingSession, isStudent, isParent, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // 1. Initial startup session restoration splash
  if (isCheckingSession) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', marginTop: '16px', marginBottom: '4px' }}>
          VE MANAGEMENT
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
          Gameri Higher Secondary School • Initializing Session...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated state -> Unified Login Page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={(role) => setActivePage('dashboard')} />;
  }

  // 3. Render appropriate dashboard or page based on active page and role
  const renderContent = () => {
    if (activePage === 'dashboard') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentDashboard setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentDashboard setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'attendance') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentAttendance setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentAttendance setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'marks') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentMarks setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentMarks setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'notes' || activePage === 'materials') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentMaterials setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentMaterials setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'activities') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentActivities setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentActivities setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'assignments') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentAssignments setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentAssignments setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'notices') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentNotices setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentNotices setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'calendar') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentCalendar setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentCalendar setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'profile') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentProfile setActivePage={setActivePage} setIsChangePasswordOpen={setIsChangePasswordOpen} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentProfile setActivePage={setActivePage} setIsChangePasswordOpen={setIsChangePasswordOpen} />
          </ProtectedRoute>
        );
      }
    }

    if (activePage === 'contacts' || activePage === 'contact') {
      if (isStudent) {
        return (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentContacts setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
      if (isParent) {
        return (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentContacts setActivePage={setActivePage} />
          </ProtectedRoute>
        );
      }
    }

    switch (activePage) {
      case 'notifications':
        return <NotificationsPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'documents':
        return <DocumentsPage />;
      default:
        return isStudent ? (
          <ProtectedRoute allowedRoles={['STUDENT']} onNavigate={setActivePage}>
            <StudentDashboard setActivePage={setActivePage} />
          </ProtectedRoute>
        ) : (
          <ProtectedRoute allowedRoles={['PARENT']} onNavigate={setActivePage}>
            <ParentDashboard setActivePage={setActivePage} />
          </ProtectedRoute>
        );
    }
  };

  return (
    <PortalShell
      activePage={activePage}
      setActivePage={setActivePage}
      isChangePasswordOpen={isChangePasswordOpen}
      setIsChangePasswordOpen={setIsChangePasswordOpen}
    >
      <Suspense fallback={<PageFallback />}>
        {renderContent()}
      </Suspense>
    </PortalShell>
  );
}
