import React from 'react';
import type { Question, Mode } from '../../types/session';
import './QuestionBubble.css';

interface QuestionBubbleProps {
  question: Question;
  mode?: Mode;
}

export const QuestionBubble: React.FC<QuestionBubbleProps> = ({ 
  question, 
  mode = 'trainer' 
}) => {
  const getModeLabel = () => {
    switch (mode) {
      case 'trainer': return 'Retrivin · Learn Mode';
      case 'introspect': return 'Retrivin · Prepare Mode';
      case 'retrospective': return 'Retrivin · Question Mode';
      default: return 'Retrivin · Learn Mode';
    }
  };

  return (
    <div className="question-bubble-container">
      <div className="question-bubble-card">
        <span className="question-bubble-label">{getModeLabel()}</span>
        <h3 className="question-bubble-text">{question.text}</h3>
        <div className="question-bubble-source-pill">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span>{question.source} &middot; {question.section}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionBubble;
