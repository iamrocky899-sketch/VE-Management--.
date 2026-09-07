import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ currentPath, onNavigate, pageTitle, children }) {
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
