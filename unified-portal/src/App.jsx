import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from './state/AuthContext';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import PortalShell from './components/PortalShell';
import StaffLayout from './components/StaffLayout';

// Eager Dashboards
import StudentDashboard from './pages/student/StudentDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';
import StaffDashboard from './pages/staff/Dashboard';

// Lazy-loaded Student Views
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'));
const StudentMarks = lazy(() => import('./pages/student/StudentMarks'));
const StudentMaterials = lazy(() => import('./pages/student/StudentMaterials'));
const StudentAssignments = lazy(() => import('./pages/student/StudentAssignments'));
const StudentActivities = lazy(() => import('./pages/student/StudentActivities'));
const StudentNotices = lazy(() => import('./pages/student/StudentNotices'));
const StudentCalendar = lazy(() => import('./pages/student/StudentCalendar'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentContacts = lazy(() => import('./pages/student/StudentContacts'));

// Lazy-loaded Parent Views
const ParentAttendance = lazy(() => import('./pages/parent/ParentAttendance'));
const ParentMarks = lazy(() => import('./pages/parent/ParentMarks'));
const ParentMaterials = lazy(() => import('./pages/parent/ParentMaterials'));
const ParentAssignments = lazy(() => import('./pages/parent/ParentAssignments'));
const ParentActivities = lazy(() => import('./pages/parent/ParentActivities'));
const ParentNotices = lazy(() => import('./pages/parent/ParentNotices'));
const ParentCalendar = lazy(() => import('./pages/parent/ParentCalendar'));
const ParentProfile = lazy(() => import('./pages/parent/ParentProfile'));
const ParentContacts = lazy(() => import('./pages/parent/ParentContacts'));

// Lazy-loaded Staff / Admin Views
const Students = lazy(() => import('./pages/staff/Students'));
const Portfolio = lazy(() => import('./pages/staff/Portfolio'));
const Attendance = lazy(() => import('./pages/staff/Attendance'));
const Marks = lazy(() => import('./pages/staff/Marks'));
const Notes = lazy(() => import('./pages/staff/Notes'));
const Activities = lazy(() => import('./pages/staff/Activities'));
const Assignments = lazy(() => import('./pages/staff/Assignments'));
const Notices = lazy(() => import('./pages/staff/Notices'));
const Calendar = lazy(() => import('./pages/staff/Calendar'));
const Reports = lazy(() => import('./pages/staff/Reports'));
const Teachers = lazy(() => import('./pages/staff/Teachers'));
const Classes = lazy(() => import('./pages/staff/Classes'));
const AcademicYears = lazy(() => import('./pages/staff/AcademicYears'));
const AcademicDocuments = lazy(() => import('./pages/staff/AcademicDocuments'));
const Settings = lazy(() => import('./pages/staff/Settings'));
const AdminNotice = lazy(() => import('./pages/staff/AdminNotice'));

function PageLoading() {
  return (
    <div className="animate-fade-in" style={{ padding: '20px 0' }}>
      <div className="card skeleton" style={{ height: '100px', marginBottom: '16px', borderRadius: '16px' }} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '16px' }}>
        <div className="card skeleton" style={{ height: '90px', borderRadius: '12px' }} />
        <div className="card skeleton" style={{ height: '90px', borderRadius: '12px' }} />
        <div className="card skeleton" style={{ height: '90px', borderRadius: '12px' }} />
      </div>
      <div className="card skeleton" style={{ height: '240px', borderRadius: '16px' }} />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isCheckingSession, isStudent, isParent, isStaff, isAdmin, isPrincipal } = useAuth();
  const [activePage, setActivePage] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace('#', '');
      return params.get('page') || hash || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActivePage(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Initial session check splash
  if (isCheckingSession) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7', marginTop: '16px', marginBottom: '4px' }}>
          VE MANAGEMENT
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
          Gameri Higher Secondary School &bull; Loading Portal...
        </p>
      </div>
    );
  }

  // Unauthenticated -> Show Unified Login Page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setActivePage('dashboard')} />;
  }

  // Render role-specific page
  const renderContent = () => {
    // 1. STUDENT PAGES
    if (isStudent) {
      switch (activePage) {
        case 'attendance':
          return <StudentAttendance setActivePage={setActivePage} />;
        case 'marks':
          return <StudentMarks setActivePage={setActivePage} />;
        case 'notes':
        case 'materials':
          return <StudentMaterials setActivePage={setActivePage} />;
        case 'assignments':
          return <StudentAssignments setActivePage={setActivePage} />;
        case 'activities':
          return <StudentActivities setActivePage={setActivePage} />;
        case 'notices':
          return <StudentNotices setActivePage={setActivePage} />;
        case 'calendar':
          return <StudentCalendar setActivePage={setActivePage} />;
        case 'profile':
          return <StudentProfile setActivePage={setActivePage} setIsChangePasswordOpen={setIsChangePasswordOpen} />;
        case 'contacts':
          return <StudentContacts setActivePage={setActivePage} />;
        case 'dashboard':
        default:
          return <StudentDashboard setActivePage={setActivePage} />;
      }
    }

    // 2. PARENT PAGES
    if (isParent) {
      switch (activePage) {
        case 'attendance':
          return <ParentAttendance setActivePage={setActivePage} />;
        case 'marks':
          return <ParentMarks setActivePage={setActivePage} />;
        case 'notes':
        case 'materials':
          return <ParentMaterials setActivePage={setActivePage} />;
        case 'assignments':
          return <ParentAssignments setActivePage={setActivePage} />;
        case 'activities':
          return <ParentActivities setActivePage={setActivePage} />;
        case 'notices':
          return <ParentNotices setActivePage={setActivePage} />;
        case 'calendar':
          return <ParentCalendar setActivePage={setActivePage} />;
        case 'profile':
          return <ParentProfile setActivePage={setActivePage} setIsChangePasswordOpen={setIsChangePasswordOpen} />;
        case 'contacts':
          return <ParentContacts setActivePage={setActivePage} />;
        case 'dashboard':
        default:
          return <ParentDashboard setActivePage={setActivePage} />;
      }
    }

    // 3. STAFF / PRINCIPAL / ADMIN PAGES
    if (isStaff) {
      switch (activePage) {
        case 'students':
          return <Students onNavigate={setActivePage} />;
        case 'portfolio':
          return <Portfolio onNavigate={setActivePage} />;
        case 'attendance':
          return <Attendance onNavigate={setActivePage} />;
        case 'marks':
          return <Marks onNavigate={setActivePage} />;
        case 'notes':
          return <Notes onNavigate={setActivePage} />;
        case 'activities':
          return <Activities onNavigate={setActivePage} />;
        case 'assignments':
          return <Assignments onNavigate={setActivePage} />;
        case 'notices':
          return <Notices onNavigate={setActivePage} />;
        case 'calendar':
          return <Calendar onNavigate={setActivePage} />;
        case 'classes':
          return <Classes onNavigate={setActivePage} />;
        case 'academic-years':
          return (
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN']} onNavigate={setActivePage}>
              <AcademicYears onNavigate={setActivePage} />
            </ProtectedRoute>
          );
        case 'teachers':
          return (
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN']} onNavigate={setActivePage}>
              <Teachers onNavigate={setActivePage} />
            </ProtectedRoute>
          );
        case 'reports':
          return (
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN', 'TEACHER']} onNavigate={setActivePage}>
              <Reports onNavigate={setActivePage} />
            </ProtectedRoute>
          );
        case 'documents':
          return <AcademicDocuments onNavigate={setActivePage} />;
        case 'settings':
          return (
            <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN']} onNavigate={setActivePage}>
              <Settings onNavigate={setActivePage} />
            </ProtectedRoute>
          );
        case 'admin-guidance':
          return <AdminNotice onNavigate={setActivePage} />;
        case 'dashboard':
        default:
          return <StaffDashboard onNavigate={setActivePage} />;
      }
    }

    return <div>Invalid Role</div>;
  };

  if (isStaff) {
    return (
      <StaffLayout currentPath={activePage} onNavigate={setActivePage} pageTitle={activePage.toUpperCase()}>
        <Suspense fallback={<PageLoading />}>
          {renderContent()}
        </Suspense>
      </StaffLayout>
    );
  }

  return (
    <PortalShell
      activePage={activePage}
      setActivePage={setActivePage}
      isChangePasswordOpen={isChangePasswordOpen}
      setIsChangePasswordOpen={setIsChangePasswordOpen}
    >
      <Suspense fallback={<PageLoading />}>
        {renderContent()}
      </Suspense>
    </PortalShell>
  );
}
