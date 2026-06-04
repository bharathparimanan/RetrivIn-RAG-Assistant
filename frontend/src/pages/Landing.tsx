import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import InputBar from '../components/layout/InputBar';
import RetrivinLogo from '../components/logo/RetrivinLogo';
import SearchView from '../components/search/SearchView';
import type { Mode } from '../types/session';
import './Landing.css';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('trainer');
  const [inputValue, setInputValue] = useState('');
  const [view, setView] = useState<'home' | 'search'>('home');

  // Authenticate user
  useEffect(() => {
    if (!localStorage.getItem('retrivin_token')) {
      navigate('/login');
    }
  }, [navigate]);

  // Route state listener to update views when clicked from sidebar on other pages
  useEffect(() => {
    if (location.state && (location.state as any).view) {
      setView((location.state as any).view);
    }
  }, [location.state]);

  const handleSend = () => {
    // Save current configuration
    sessionStorage.setItem('retrivin_session_mode', mode);
    if (inputValue.trim()) {
      sessionStorage.setItem('retrivin_start_topic', inputValue.trim());
    }
    setInputValue('');
    navigate('/session');
  };

  const getModeLabel = (activeMode: Mode) => {
    switch (activeMode) {
      case 'trainer': return 'Learn';
      case 'introspect': return 'Prepare';
      case 'retrospective': return 'Question';
      default: return 'Learn';
    }
  };

  return (
    <div className="landing-layout-wrapper">
      {/* Sidebar navigation */}
      <Sidebar 
        activeView={view}
        onSearch={() => setView('search')}
        onNewSession={() => setView('home')}
      />

      {/* Main content frame */}
      <div className="landing-main-frame">
        <Topbar 
          view="landing" 
          activeMode={mode} 
          onModeChange={(newMode) => setMode(newMode)} 
        />

        <div className={`landing-content-body ${view === 'search' ? 'search-view-layout' : ''}`}>
          {view === 'search' ? (
            <SearchView />
          ) : (
            <>
              <div className="landing-center-illustration">
                <div className="landing-logo-opacity-container">
                  <RetrivinLogo size={64} />
                </div>
                <h1 className="landing-hero-heading">what should we dive into?</h1>
                <p className="landing-hero-subtext">YOUR SESSION AWAITS</p>
                
                <div className="landing-mode-selector-row">
                  <button 
                    type="button"
                    className={`landing-mode-pill ${mode === 'trainer' ? 'active' : ''}`}
                    onClick={() => setMode('trainer')}
                  >
                    Learn
                  </button>
                  <button 
                    type="button"
                    className={`landing-mode-pill ${mode === 'introspect' ? 'active' : ''}`}
                    onClick={() => setMode('introspect')}
                  >
                    Prepare
                  </button>
                  <button 
                    type="button"
                    className={`landing-mode-pill ${mode === 'retrospective' ? 'active' : ''}`}
                    onClick={() => setMode('retrospective')}
                  >
                    Question
                  </button>
                </div>
              </div>

              <div className="landing-input-panel">
                <InputBar 
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  placeholder="Start your session..."
                  modeLabel={`${getModeLabel(mode)} Mode`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;
