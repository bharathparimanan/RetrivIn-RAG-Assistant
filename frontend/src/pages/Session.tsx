import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import InputBar from '../components/layout/InputBar';
import QuestionBubble from '../components/session/QuestionBubble';
import AnswerBubble from '../components/session/AnswerBubble';
import ScoreCard from '../components/session/ScoreCard';
import TypingIndicator from '../components/session/TypingIndicator';
import ProgressDots from '../components/session/ProgressDots';
import useTimer from '../hooks/useTimer';
import useSession from '../hooks/useSession';
import type { Mode } from '../types/session';
import './Session.css';

export const Session: React.FC = () => {
  const navigate = useNavigate();
  
  // Load session configuration or default to learn (trainer) mode
  const [sessionMode, setSessionMode] = useState<Mode>('trainer');
  const [startTopic, setStartTopic] = useState<string | null>(null);
  
  const [inputValue, setInputValue] = useState('');
  const timer = useTimer();
  const session = useSession();
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Authenticate user
  useEffect(() => {
    if (!localStorage.getItem('retrivin_token')) {
      navigate('/login');
    }
  }, [navigate]);

  // Load configuration and start timer on mount
  useEffect(() => {
    const savedMode = sessionStorage.getItem('retrivin_session_mode') as Mode;
    if (savedMode) {
      setSessionMode(savedMode);
    }
    
    const topic = sessionStorage.getItem('retrivin_start_topic');
    if (topic) {
      setStartTopic(topic);
      // Clear it out so it doesn't reappear on subsequent restarts
      sessionStorage.removeItem('retrivin_start_topic');
    }

    timer.start();
    return () => {
      timer.stop();
    };
  }, []);

  // Stop timer when session is complete
  useEffect(() => {
    if (session.status === 'complete') {
      timer.stop();
    }
  }, [session.status]);

  // Scroll to bottom when entries or status updates
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.entries, session.status]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    session.submitAnswer(inputValue.trim());
    setInputValue('');
  };

  const handleSkip = () => {
    session.skipQuestion();
  };

  const handleRestart = () => {
    session.restartSession();
    timer.reset();
    timer.start();
  };

  // Calculate final score summary
  const scoredEntries = session.entries.filter(e => e.score);
  const totalScore = scoredEntries.reduce((sum, e) => sum + (e.score?.score || 0), 0);
  const averageScore = scoredEntries.length > 0 
    ? (totalScore / scoredEntries.length).toFixed(1) 
    : '0.0';

  const showLoader = session.status === 'answered' || session.status === 'scored';

  return (
    <div className="session-layout-wrapper">
      <Sidebar />

      <div className="session-main-frame">
        <Topbar 
          view="session"
          activeMode={sessionMode}
          onModeChange={setSessionMode}
          timerDisplay={timer.display}
          currentIndex={session.currentIndex}
          dotsComponent={
            <ProgressDots 
              done={session.currentIndex} 
              current={session.currentIndex} 
              total={10} 
            />
          }
        />

        <div className="session-chat-container">
          <div className="session-chat-scrollable">
            {/* Display initial topic if entered from landing */}
            {startTopic && (
              <div className="chat-start-topic-bubble-row">
                <div className="chat-start-topic-bubble">
                  I want to focus our session on: <strong>&ldquo;{startTopic}&rdquo;</strong>
                </div>
              </div>
            )}

            {/* Session bubbles */}
            {session.entries.map((entry, index) => (
              <div key={index} className="session-entry-block">
                <QuestionBubble question={entry.question} mode={sessionMode} />
                
                {entry.answer && (
                  <AnswerBubble answer={entry.answer} />
                )}
                
                {entry.score && (
                  <ScoreCard score={entry.score} />
                )}
              </div>
            ))}

            {/* Typing Loader Indicator */}
            {showLoader && (
              <TypingIndicator />
            )}

            {/* Session Complete summary */}
            {session.status === 'complete' && (
              <div className="session-complete-card-row">
                <div className="session-complete-card">
                  <div className="complete-score-circle">
                    <span className="complete-score-val">{averageScore}</span>
                    <span className="complete-score-lbl">Avg /10</span>
                  </div>
                  <div className="complete-info-col">
                    <h2 className="complete-heading">Session Complete!</h2>
                    <p className="complete-desc">
                      You completed the interview prep session in <strong>{timer.display}</strong>. 
                      You responded to <strong>{scoredEntries.length} out of 10</strong> questions.
                    </p>
                    <button 
                      type="button" 
                      className="complete-restart-btn"
                      onClick={handleRestart}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      <span>Restart Prep</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom scroll anchor */}
            <div ref={chatBottomRef} />
          </div>
        </div>

        <div className="session-input-panel">
          <InputBar
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onSkip={handleSkip}
            showSkip={session.status === 'question'}
            disabled={session.status !== 'question'}
            placeholder={
              session.status === 'complete' 
                ? 'Session complete. Click Restart to try again.' 
                : 'Type your answer...'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Session;
