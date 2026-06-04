import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  onLogout?: () => void;
  activeView?: 'home' | 'search';
  onSearch?: () => void;
  onNewSession?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onLogout,
  activeView = 'home',
  onSearch,
  onNewSession
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleNavClick = (path: string, disabled: boolean, label: string) => {
    if (disabled) return;
    if (label === 'Search') {
      if (onSearch) onSearch();
      navigate(path, { state: { view: 'search' } });
    } else if (label === 'New Session') {
      if (onNewSession) onNewSession();
      navigate(path, { state: { view: 'home' } });
    } else {
      navigate(path);
    }
  };

  const menuItems = [
    { 
      label: 'Search', 
      path: '/',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      disabled: false,
      matchExact: true
    },
    { 
      label: 'New Session', 
      path: '/', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      disabled: false,
      matchExact: true
    },
    { 
      label: 'Sessions', 
      path: '/session', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      disabled: false,
      matchExact: false
    },
    { 
      label: 'Documents', 
      path: '/documents', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      disabled: false,
      matchExact: false
    },
    { 
      label: 'Report Cards', 
      path: '/reports', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      disabled: true,
      matchExact: false
    },
    { 
      label: 'Notes', 
      path: '/notes', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      disabled: true,
      matchExact: false
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('retrivin_token');
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand-wrapper">
        <button className="sidebar-hamburger" onClick={() => setCollapsed(prev => !prev)} aria-label="Toggle Navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
            <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
          </svg>
        </button>
        <span className="sidebar-brand-name">RETRIVIN</span>
      </div>

      <nav className="sidebar-nav-menu">
        <ul className="sidebar-nav-list">
          {menuItems.map((item, index) => {
            let isActive = false;
            if (!item.disabled) {
              if (item.label === 'New Session') {
                isActive = location.pathname === '/' && activeView === 'home';
              } else if (item.label === 'Search') {
                isActive = location.pathname === '/' && activeView === 'search';
              } else if (item.label === 'Sessions' && location.pathname === '/session') {
                isActive = true;
              } else if (item.label === 'Documents' && location.pathname === '/documents') {
                isActive = true;
              }
            }

            return (
              <li 
                key={index} 
                className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                onClick={() => handleNavClick(item.path, item.disabled, item.label)}
              >
                <div className="sidebar-nav-icon">{item.icon}</div>
                <span className="sidebar-nav-label">{item.label}</span>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer-profile">
        <div className="sidebar-avatar">B</div>
        <div className="sidebar-user-details">
          <div className="sidebar-user-name">Bruno</div>
          <div className="sidebar-account-sub" onClick={handleLogout} title="Click to log out">
            Account details
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
