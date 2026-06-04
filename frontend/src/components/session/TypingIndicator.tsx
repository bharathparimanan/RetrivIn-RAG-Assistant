import React from 'react';
import './TypingIndicator.css';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator-container">
      <div className="typing-indicator-card">
        <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
        <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
        <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
