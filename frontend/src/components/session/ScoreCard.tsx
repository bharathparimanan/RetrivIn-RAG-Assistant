import React from 'react';
import type { Score } from '../../types/session';
import './ScoreCard.css';

interface ScoreCardProps {
  score: Score;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  return (
    <div className="scorecard-container">
      <div className="scorecard-card">
        {/* Left score panel */}
        <div className="scorecard-display">
          <span className="scorecard-num">{score.score}</span>
          <span className="scorecard-total">/10</span>
        </div>

        {/* Right feedback panel */}
        <div className="scorecard-feedback-panel">
          <div className="scorecard-section-label">ASSESSOR FEEDBACK</div>
          <p className="scorecard-text">{score.feedback}</p>
          
          {(score.strengths.length > 0 || score.gaps.length > 0) && (
            <div className="scorecard-bullets">
              {score.strengths.length > 0 && (
                <div className="scorecard-bullet-col">
                  <span className="bullet-title strengths">Strengths</span>
                  <ul>
                    {score.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}
              {score.gaps.length > 0 && (
                <div className="scorecard-bullet-col">
                  <span className="bullet-title gaps">Gaps</span>
                  <ul>
                    {score.gaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
