import React from 'react';
import { Menu } from 'lucide-react';
import UserMenu from './UserMenu';

export default function Header({ onToggleMobileNav, pageTitle = 'Dashboard' }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-nav-toggle"
          onClick={onToggleMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <h2 className="header-title">{pageTitle}</h2>
      </div>

      <div className="header-right">
        <UserMenu />
      </div>
    </header>
  );
}
