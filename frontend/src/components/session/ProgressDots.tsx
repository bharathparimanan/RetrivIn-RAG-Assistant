import React from 'react';
import './ProgressDots.css';

interface ProgressDotsProps {
  total?: number;
  done: number;
  current: number;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({ 
  total = 10, 
  done, 
  current 
}) => {
  const dots = Array.from({ length: total });

  return (
    <div className="progress-dots-container">
      {dots.map((_, index) => {
        let statusClass = 'upcoming';
        if (index < done) {
          statusClass = 'done';
        } else if (index === current) {
          statusClass = 'current';
        }
        
        return (
          <span 
            key={index} 
            className={`progress-dot-item ${statusClass}`}
            title={`Question ${index + 1}: ${
              statusClass === 'done' ? 'Completed' : 
              statusClass === 'current' ? 'Current' : 'Upcoming'
            }`}
          />
        );
      })}
    </div>
  );
};

export default ProgressDots;
