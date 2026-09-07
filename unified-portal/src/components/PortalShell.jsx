import React from 'react';
import { useAuth } from '../state/AuthContext';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import ChangePasswordModal from './ChangePasswordModal';

export default function PortalShell({
  children,
  activePage = 'dashboard',
  setActivePage,
  isChangePasswordOpen,
  setIsChangePasswordOpen
}) {
  const { isStudent, isParent, user } = useAuth();

  return (
    <div className="app-container">
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Unified Top Navigation */}
        <Navbar
          activePage={activePage}
          setActivePage={setActivePage}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />

        {/* Main Content Area */}
        <main className="main-content">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          activePage={activePage}
          setActivePage={setActivePage}
        />

        {/* Voluntary Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      </div>
    </div>
  );
}
