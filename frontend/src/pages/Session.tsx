import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import RetrivinLogo from '../components/logo/RetrivinLogo';
import { getSession, submitAnswer as submitAnswerApi } from '../lib/api';
import './Session.css';

interface Question {
  id: string;
  text: string;
  source: string;
  section: string;
}

const Session: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Retrieving your documents...');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('trainer');
  const [seconds, setSeconds] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    'Retrieving your documents...',
    'Finding relevant experience...',
    'Generating questions with Claude...',
    'Almost ready...',
  ];

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Poll for session
  useEffect(() => {
    if (!localStorage.getItem('retrivin_token')) {
      navigate('/login');
      return;
    }
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let msgIndex = 0;
    const messages = [
      'Retrieving your documents...',
      'Finding relevant experience...',
      'Generating questions with Claude...',
      'Almost ready...',
    ];

    const poll = async () => {
      try {
        setLoadingMessage(messages[msgIndex % messages.length]);
        msgIndex++;

        const session = await getSession(sessionId);
        setMode(session.mode);

        if (session.status === 'ready' && session.questions.length > 0) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          const mapped: Question[] = session.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            source: q.source || 'resume',
            section: q.section || 'experience',
          }));
          setQuestions(mapped);
          setLoading(false);
          return;
        }

        if (session.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll immediately then every 2 seconds
    poll();
    pollingRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [sessionId]);

  // Scroll active question into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  const handleAnswerChange = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleNext = () => {
    if (activeIndex < questions.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const answeredCount = Object.values(answers).filter(a => a.trim()).length;
  const allAnswered = answeredCount === questions.length;

  const handleSubmitAll = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (sessionId) {
        for (const question of questions) {
          const text = answers[question.id] || '';
          if (text.trim()) {
            await submitAnswerApi(sessionId, question.id, text);
          }
        }
      }
      navigate(`/reports/${sessionId}`);
    } catch (err: any) {
      console.error('Submit failed:', err);
      setSubmitting(false);
    }
  };

  const modeLabel = (m: string) => {
    if (m === 'trainer') return 'Learn';
    if (m === 'introspect') return 'Prepare';
    return 'Question';
  };

  if (loading) {
    return (
      <div className="session-loading-layout">
        <Sidebar mode={mode} />
        <div className="session-loading-main">
          <div className="session-loading-content">
            <div className="session-loading-logo">
              <RetrivinLogo size={56} />
            </div>
            <div className="session-loading-text">
              <p className="session-loading-msg">{loadingMessage}</p>
              <p className="session-loading-sub">This usually takes 15–30 seconds</p>
            </div>
            <div className="session-loading-bar">
              <div className="session-loading-bar-fill" />
            </div>
            <div className="session-loading-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-layout">
      <Sidebar />
      <div className="session-main">

        {/* Topbar */}
        <div className="session-topbar">
          <div className="session-topbar-left">
            <div className="session-mode-pill active">{modeLabel(mode)}</div>
          </div>
          <div className="session-topbar-center">
            <div className="session-progress-dots">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className={`session-dot ${
                    answers[q.id]?.trim()
                      ? 'done'
                      : i === activeIndex
                      ? 'current'
                      : ''
                  }`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          </div>
          <div className="session-topbar-right">
            <div className="session-timer">
              <span className="session-timer-dot" />
              {formatTime(seconds)}
            </div>
            <span className="session-q-counter">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
        </div>

        {/* Questions list */}
        <div className="session-body">
          <div className="session-questions-list">
            {questions.map((q, i) => (
              <div
                key={q.id}
                ref={i === activeIndex ? activeRef : null}
                className={`session-question-card ${i === activeIndex ? 'active' : ''} ${answers[q.id]?.trim() ? 'answered' : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <div className="session-q-header">
                  <span className="session-q-label">
                    RETRIVIN · {modeLabel(mode).toUpperCase()} MODE
                  </span>
                  <span className="session-q-num">Q{i + 1}</span>
                </div>
                <p className="session-q-text">{q.text}</p>
                <div className="session-q-source">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {q.source} · {q.section}
                </div>

                {i === activeIndex && (
                  <div className="session-answer-area">
                    <textarea
                      className="session-answer-input"
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className="session-answer-actions">
                      <button
                        className="session-nav-btn"
                        onClick={handlePrev}
                        disabled={i === 0}
                      >
                        ← Prev
                      </button>
                      {i < questions.length - 1 ? (
                        <button
                          className="session-nav-btn primary"
                          onClick={handleNext}
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          className={`session-submit-all ${allAnswered ? 'ready' : ''}`}
                          onClick={handleSubmitAll}
                          disabled={submitting}
                        >
                          {submitting ? 'Submitting...' : `Submit all ${questions.length} answers →`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Session;
