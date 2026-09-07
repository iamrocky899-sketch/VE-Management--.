import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function StaffLayout({ currentPath, onNavigate, pageTitle, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="app-main">
        <Header
          onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
          pageTitle={pageTitle}
        />

        <main className="content-container">{children}</main>
      </div>
    </div>
  );
}
