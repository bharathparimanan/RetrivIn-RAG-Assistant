import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createSession } from '../lib/api';
import DocumentSelectorModal from '../components/session/DocumentSelectorModal';
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
  const [sending, setSending] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [targetRole, setTargetRole] = useState('');

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
    if (!inputValue.trim()) return;
    setTargetRole(inputValue.trim());
    setShowDocModal(true);
  };

  const handleSessionStart = async (selectedDocIds: string[]) => {
    setShowDocModal(false);
    setSending(true);
    try {
      const session = await createSession(mode, targetRole, selectedDocIds);
      navigate(`/session?id=${session.session_id}`);
    } catch (err: any) {
      console.error('Failed to create session:', err.message);
    } finally {
      setSending(false);
    }
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
        mode={mode}
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
                  placeholder="Enter target role e.g. Senior Data Engineer..."
                  modeLabel={`${getModeLabel(mode)} Mode`}
                  disabled={sending}
                />
              </div>
            </>
          )}
        </div>
      </div>
      {showDocModal && (
        <DocumentSelectorModal
          mode={mode}
          targetRole={targetRole}
          onConfirm={handleSessionStart}
          onClose={() => setShowDocModal(false)}
        />
      )}
    </div>
  );
};

export default Landing;
