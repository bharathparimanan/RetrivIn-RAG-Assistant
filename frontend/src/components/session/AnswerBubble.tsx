import React from 'react';
import type { Answer } from '../../types/session';
import './AnswerBubble.css';

interface AnswerBubbleProps {
  answer: Answer;
}

export const AnswerBubble: React.FC<AnswerBubbleProps> = ({ answer }) => {
  return (
    <div className="answer-bubble-container">
      <div className="answer-bubble-card">
        <p className="answer-bubble-text">{answer.text}</p>
      </div>
    </div>
  );
};

export default AnswerBubble;
