import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RetrivinLogo from '../components/logo/RetrivinLogo';
import { login, register } from '../lib/api';
import './Login.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // If token exists, direct to landing page
    if (localStorage.getItem('retrivin_token')) {
      navigate('/');
    }
  }, [navigate]);

  const handleEmailSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorText('');

    if (!email || !email.includes('@') || email.length < 5) {
      setErrorText('Please enter a valid email address.');
      triggerErrorShake();
      return;
    }
    setStep(2);
  };

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorText('');

    if (!password || password.length < 4) {
      setErrorText('Password must be at least 4 characters.');
      triggerErrorShake();
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setErrorText(err.message || 'Something went wrong');
      triggerErrorShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerErrorShake = () => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
    }, 400);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleEmailSubmit();
    } else {
      handlePasswordSubmit();
    }
  };

  return (
    <div className="login-page-container">
      <div className={`login-page-card ${shake ? 'shake-animation' : ''}`}>
        <div className="login-card-header-row">
          <RetrivinLogo size={28} />
          <span className="login-card-wordmark">RETRIVIN</span>
        </div>

        <div className="login-card-body">
          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="login-form-step">
              <h2 className="login-form-title">Sign in to start</h2>
              <p className="login-form-subtitle">Enter your email address to proceed.</p>
              
              <div className="login-input-pill">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoFocus
                  autoComplete="email"
                  className="login-input-field"
                />
                <button type="submit" className="login-enter-btn" onClick={handleSubmit} aria-label="Submit" disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="login-form-step">
              <div className="login-back-nav">
                <button 
                  type="button" 
                  className="login-back-btn"
                  onClick={() => { setStep(1); setErrorText(''); }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Back</span>
                </button>
              </div>

              <h2 className="login-form-title">Enter password</h2>
              <p className="login-form-subtitle font-mono-sub">{email}</p>
              
              <div className="login-input-pill">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="login-input-field"
                />
                <button type="submit" className="login-enter-btn" onClick={handleSubmit} aria-label="Submit" disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </form>
          )

          }

          {errorText && <span className="login-error-message">{errorText}</span>}
        </div>

        <div className="login-card-footer-row">
          <span>SSO coming soon</span>
        </div>
        <p className="login-auth-toggle">
          {authMode === 'login' ? (
            <>
              No account?{' '}
              <button
                type="button"
                className="login-auth-toggle-btn"
                onClick={() => {
                  setAuthMode('register');
                  setStep(1);
                  setPassword('');
                  setErrorText('');
                }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button
                type="button"
                className="login-auth-toggle-btn"
                onClick={() => {
                  setAuthMode('login');
                  setStep(1);
                  setPassword('');
                  setErrorText('');
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
