import React, { useState, useEffect, useRef } from 'react';
import type { SourceItem, ChatMessage } from '../../types/sourcing';
import InputBar from '../layout/InputBar';
import RetrivinLogo from '../logo/RetrivinLogo';
import './SummarisationWindow.css';

interface SummarisationWindowProps {
  selectedSources: SourceItem[];
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onPin: (type: 'note' | 'project', text: string) => void;
  onDeepResearch: () => void;
  hasDeepResearch: boolean;
  chatValue: string;
  setChatValue: (val: string) => void;
  isTyping: boolean;
}

const MOCK_SUMMARIES: Record<string, string> = {
  s1: 'LinkedIn profile shows 3 years in data engineering roles. Strong on pipeline tooling — Airflow, Spark, Azure. Gaps visible in system design and distributed architecture discussion.',
  s2: 'GitHub activity: 12 public repos. Most active in Python. Notable: airflow-etl-pipeline (47 stars), delta-lake-patterns. No contributions to open source DE tooling.',
  s3: 'YouTube — Kafka Deep Dive (3h12m): Covers producer-consumer internals, partition rebalancing, exactly-once semantics. Key insight: consumer group lag monitoring is the most commonly missed operational skill.',
  s4: 'Q3 Report: Performance rated 3.8/5. Strongest area: delivery. Weakest: technical communication and architecture justification in design reviews.',
  s5: 'System Design Primer: Covers CAP theorem, consistent hashing, load balancing. Relevant to senior DE roles requiring distributed systems knowledge.',
  s6: 'resume.pdf: 2 pages. 3 roles listed. Skills section lists 18 tools. Experience descriptions are task-focused, not outcome-focused — common interview weakness.',
};

export const SummarisationWindow: React.FC<SummarisationWindowProps> = ({
  selectedSources,
  chatMessages,
  onSendMessage,
  onPin,
  onDeepResearch,
  hasDeepResearch,
  chatValue,
  setChatValue,
  isTyping,
}) => {
  const [floatingMenu, setFloatingMenu] = useState<{ top: number; left: number; text: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll handler
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping, hasDeepResearch]);

  // Text selection handler
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';

    if (selectedText) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setFloatingMenu({
          top: rect.top - 45,
          left: rect.left + rect.width / 2,
          text: selectedText,
        });
      }
    } else {
      setFloatingMenu(null);
    }
  };

  // Clear selection listener
  useEffect(() => {
    const clearSelection = () => {
      if (!window.getSelection()?.toString().trim()) {
        setFloatingMenu(null);
      }
    };
    document.addEventListener('mouseup', clearSelection);
    return () => document.removeEventListener('mouseup', clearSelection);
  }, []);

  const getPinContent = () => {
    if (floatingMenu?.text) {
      return floatingMenu.text;
    }
    const activeSelection = window.getSelection()?.toString().trim();
    if (activeSelection) {
      return activeSelection;
    }
    if (selectedSources.length > 0) {
      const lastSource = selectedSources[selectedSources.length - 1];
      return MOCK_SUMMARIES[lastSource.id] || `Summary details for ${lastSource.name}`;
    }
    return '';
  };

  const handlePinAction = (type: 'note' | 'project') => {
    const text = getPinContent();
    if (text) {
      onPin(type, text);
      window.getSelection()?.removeAllRanges();
      setFloatingMenu(null);
    } else {
      alert('Select sources or highlight text to pin insights.');
    }
  };

  const handleFloatingPin = () => {
    if (floatingMenu?.text) {
      onPin('note', floatingMenu.text);
      window.getSelection()?.removeAllRanges();
      setFloatingMenu(null);
    }
  };

  const handleFloatingQuote = () => {
    if (floatingMenu?.text) {
      setChatValue(`> ${floatingMenu.text}\n\n`);
      window.getSelection()?.removeAllRanges();
      setFloatingMenu(null);
    }
  };

  const hasSources = selectedSources.length > 0;

  return (
    <div className="search-summarise-window" onMouseUp={handleTextSelection}>
      {/* WINDOW TOPBAR */}
      <div className="search-summarise-topbar">
        <div className="topbar-title-wrap">
          {hasSources && (
            <span className="topbar-status-label">
              {selectedSources.length} SOURCE{selectedSources.length > 1 ? 'S' : ''} SELECTED
            </span>
          )}
        </div>
        
        <div className="topbar-action-row">
          <button 
            type="button" 
            className="topbar-action-icon-btn"
            onClick={() => handlePinAction('project')}
            title="Pin to Project"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="10" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          
          <button 
            type="button" 
            className="topbar-action-icon-btn"
            onClick={() => handlePinAction('note')}
            title="Pin to Notes"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* SUMMARY DISPLAY SCROLL */}
      <div className="search-summarise-scroll" ref={scrollRef}>
        {!hasSources ? (
          <div className="search-summarise-empty">
            <RetrivinLogo size={40} className="faded-logo-opacity" />
            <p className="empty-state-headline">Select sources to begin.</p>
          </div>
        ) : (
          <div className="search-summarise-list">
            {selectedSources.map(source => (
              <div key={source.id} className="search-summary-card">
                <span className="summary-card-source-badge">{source.name}</span>
                <p className="summary-card-body-text">
                  {MOCK_SUMMARIES[source.id] || `AI summaries for ${source.name} have been compiled successfully.`}
                </p>
              </div>
            ))}

            {hasDeepResearch && (
              <div className="search-summary-card deep-analysis-card">
                <span className="summary-card-source-badge deep-badge">DEEP RESEARCH AGGREGATION</span>
                <p className="summary-card-body-text deep-text">
                  <strong>RETRIVIN DEEP ANALYSIS REPORT</strong><br />
                  =================================<br />
                  Ingested source channels indicate solid developer execution competency (e.g. Airflow pipelines, Spark clusters, Python repositories). 
                  However, architectural validation gaps persist. Professional experience focuses primarily on transactional implementations 
                  rather than distributed optimizations. Key strategic advice: Direct training toward high-scale trade-off choices 
                  (CAP theorem design patterns, Kafka offset management, partition tuning) and practice outcome-based communication structures.
                </p>
              </div>
            )}

            {/* Conversational turns */}
            {chatMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`chat-bubble-container-row ${msg.role === 'user' ? 'user-align' : 'assistant-align'}`}
              >
                {msg.role === 'user' ? (
                  <div className="chat-user-bubble">
                    <p className="chat-bubble-paragraph">{msg.text}</p>
                  </div>
                ) : (
                  <div className="search-summary-card ai-bubble-card">
                    <span className="summary-card-source-badge ai-badge">AI Assistant</span>
                    <p className="summary-card-body-text">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="chat-bubble-container-row assistant-align">
                <div className="ai-typing-dots">
                  <span className="pulse-dot" />
                  <span className="pulse-dot" />
                  <span className="pulse-dot" />
                </div>
              </div>
            )}

            {!hasDeepResearch && (
              <button 
                type="button" 
                className="deep-research-trigger-btn"
                onClick={onDeepResearch}
              >
                &rarr; Deep research on selected sources
              </button>
            )}
          </div>
        )}
      </div>

      {/* CHAT INPUT BAR */}
      <div className="search-summarise-chat-panel">
        <InputBar
          placeholder="Ask anything about your sources..."
          value={chatValue}
          onChange={setChatValue}
          onSend={() => {
            if (chatValue.trim()) {
              onSendMessage(chatValue);
            }
          }}
          modeLabel="Sourcing"
          disabled={!hasSources}
        />
      </div>

      {/* FLOATING TEXT SELECTION BAR */}
      {floatingMenu && (
        <div 
          className="floating-text-actionbar"
          style={{ 
            position: 'fixed', 
            top: `${floatingMenu.top}px`, 
            left: `${floatingMenu.left}px`,
            transform: 'translateX(-50%)'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button 
            type="button" 
            className="floating-bar-button"
            onClick={handleFloatingPin}
          >
            Pin to Notes
          </button>
          <button 
            type="button" 
            className="floating-bar-button quote"
            onClick={handleFloatingQuote}
          >
            Quote in Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default SummarisationWindow;
