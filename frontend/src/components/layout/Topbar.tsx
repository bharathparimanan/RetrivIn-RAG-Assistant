import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RetrivinLogo from '../logo/RetrivinLogo';
import type { Mode } from '../../types/session';
import './Topbar.css';

interface TopbarProps {
  view: 'landing' | 'session';
  activeMode?: Mode;
  onModeChange?: (mode: Mode) => void;
  timerDisplay?: string;
  currentIndex?: number;
  dotsComponent?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({
  view,
  activeMode = 'trainer',
  onModeChange,
  timerDisplay = '00:00',
  currentIndex = 0,
  dotsComponent
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectMode = (mode: Mode) => {
    if (onModeChange) onModeChange(mode);
    setDropdownOpen(false);
  };

  if (view === 'landing') {
    return (
      <header className="topbar-container landing-view">
        <div className="topbar-left" onClick={() => navigate('/')}>
          <RetrivinLogo size={20} />
          <span className="topbar-wordmark">RETRIVIN</span>
        </div>

        <div className="topbar-right" ref={dropdownRef}>
          <button 
            className="topbar-dropdown-trigger" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span>New Session</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="topbar-dropdown-menu">
              <div 
                className={`topbar-dropdown-item ${activeMode === 'trainer' ? 'active' : ''}`}
                onClick={() => handleSelectMode('trainer')}
              >
                Learn (Trainer)
              </div>
              <div 
                className={`topbar-dropdown-item ${activeMode === 'introspect' ? 'active' : ''}`}
                onClick={() => handleSelectMode('introspect')}
              >
                Prepare (Introspect)
              </div>
              <div 
                className={`topbar-dropdown-item ${activeMode === 'retrospective' ? 'active' : ''}`}
                onClick={() => handleSelectMode('retrospective')}
              >
                Question (Retrospective)
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Session View
  return (
    <header className="topbar-container session-view">
      <div className="topbar-left">
        <div className="session-mini-mode-row">
          <button 
            className={`session-mini-mode-pill ${activeMode === 'trainer' ? 'active' : ''}`}
            onClick={() => onModeChange && onModeChange('trainer')}
          >
            Learn
          </button>
          <button 
            className={`session-mini-mode-pill ${activeMode === 'introspect' ? 'active' : ''}`}
            onClick={() => onModeChange && onModeChange('introspect')}
          >
            Prepare
          </button>
          <button 
            className={`session-mini-mode-pill ${activeMode === 'retrospective' ? 'active' : ''}`}
            onClick={() => onModeChange && onModeChange('retrospective')}
          >
            Question
          </button>
        </div>
      </div>

      <div className="topbar-center">
        {dotsComponent}
      </div>

      <div className="topbar-right">
        <div className="session-timer-wrap">
          <span className="session-timer-pulse"></span>
          <span className="session-timer-time">{timerDisplay}</span>
        </div>
        <span className="session-counter-text">Q {Math.min(currentIndex + 1, 10)}/10</span>
      </div>
    </header>
  );
};

export default Topbar;
