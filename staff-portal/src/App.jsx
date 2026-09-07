import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Portfolio from './pages/Portfolio';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import Notes from './pages/Notes';
import Activities from './pages/Activities';
import Assignments from './pages/Assignments';
import Notices from './pages/Notices';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import AcademicYears from './pages/AcademicYears';
import AcademicDocuments from './pages/AcademicDocuments';
import Settings from './pages/Settings';
import ModulePlaceholder from './pages/ModulePlaceholder';
import AdminNotice from './pages/AdminNotice';

export default function App() {
  const { isAuthenticated, user, isTeacher, isPrincipal, isAdmin } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => {
    const full = (window.location.pathname || '') + (window.location.search || '');
    return full && full !== '/' ? full : '/dashboard';
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const full = (window.location.pathname || '') + (window.location.search || '');
      setCurrentPath(full || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    setCurrentPath(path);
    try {
      window.history.pushState({}, '', path);
    } catch (e) {}
  };

  // If not authenticated, always show Login
  if (!isAuthenticated || !user) {
    return <Login />;
  }

  // If user logged in as Admin, show Admin guidance
  if (isAdmin) {
    return (
      <Layout currentPath={currentPath} onNavigate={navigate} pageTitle="Administrator Access">
        <AdminNotice />
      </Layout>
    );
  }

  const basePath = currentPath.split('?')[0];
  const queryParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : window.location.search);
  const activeStudentId = queryParams.get('studentId');

  // Map path to page title
  const titles = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/students': isPrincipal ? 'All Students Directory' : 'Class Students',
    '/classes': 'Class & Subject Directory',
    '/academic-years': 'Academic Year Management',
    '/attendance': isPrincipal ? 'School Attendance Register' : 'Class Attendance Register',
    '/marks': isPrincipal ? 'School Academic Marks' : 'Class Academic Marks',
    '/documents': 'Academic Documents Center',
    '/portfolio': 'Student 360° Portfolio',
    '/teachers': 'Teachers & Staff Directory',
    '/notes': 'Notes & Study Materials',
    '/activities': isPrincipal ? 'School Activities & Progress' : 'Class Vocational Activities',
    '/assignments': isPrincipal ? 'School Homework & Assignments' : 'Class Assignments & Homework',
    '/notices': 'School Notices & Circulars',
    '/calendar': 'Academic Calendar',
    '/reports': 'School Reports & Analytics',
    '/settings': isPrincipal ? 'Institutional Settings & Policies' : 'System Settings',
    '/profile': 'My Staff Profile'
  };

  const pageTitle = titles[basePath] || 'Staff Portal';

  // Role protected routing
  const renderContent = () => {
    switch (basePath) {
      case '/':
      case '/dashboard':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Dashboard onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/students':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Students onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/classes':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Classes onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/academic-years':
        return (
          <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <AcademicYears onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/attendance':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Attendance onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/marks':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Marks onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/documents':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <AcademicDocuments onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/portfolio':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Portfolio onNavigate={navigate} studentId={activeStudentId} />
          </ProtectedRoute>
        );

      case '/notes':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Notes onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/activities':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Activities onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/assignments':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Assignments onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/notices':
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <Notices onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/calendar':
        return (
          <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN', 'TEACHER']} onNavigate={navigate}>
            <Calendar onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/reports':
        return (
          <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN', 'TEACHER']} onNavigate={navigate}>
            <Reports onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/teachers':
        return (
          <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN', 'TEACHER']} onNavigate={navigate}>
            <Teachers onNavigate={navigate} />
          </ProtectedRoute>
        );

      case '/settings':
        return (
          <ProtectedRoute allowedRoles={['PRINCIPAL', 'ADMIN', 'TEACHER']} onNavigate={navigate}>
            <Settings onNavigate={navigate} />
          </ProtectedRoute>
        );

      default:
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'PRINCIPAL', 'ADMIN']} onNavigate={navigate}>
            <DashboardPlaceholder />
          </ProtectedRoute>
        );
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={navigate} pageTitle={pageTitle}>
      {renderContent()}
    </Layout>
  );
}
