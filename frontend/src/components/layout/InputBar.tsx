import React, { useRef, useEffect } from 'react';
import './InputBar.css';

interface InputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  placeholder?: string;
  modeLabel?: string;
  disabled?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({
  value,
  onChange,
  onSend,
  onSkip,
  showSkip = false,
  placeholder = 'Start your session...',
  modeLabel = 'Learn',
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize handler
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`input-bar-container ${disabled ? 'disabled-bar' : ''}`}>
      <div className="input-bar-left-actions">
        <button 
          className="input-bar-btn" 
          type="button" 
          aria-label="Attach Document"
          title="Attach files (coming soon)"
          disabled={disabled}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <button 
          className="input-bar-btn" 
          type="button" 
          aria-label="Speech Input"
          title="Microphone input (coming soon)"
          disabled={disabled}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      </div>

      <textarea
        ref={textareaRef}
        rows={1}
        className="input-bar-textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <div className="input-bar-right-actions">
        {!showSkip && modeLabel && (
          <div className="input-bar-mode-badge" title="Active Session Mode">
            {modeLabel}
          </div>
        )}
        
        {showSkip && onSkip && (
          <button 
            className="input-bar-skip-btn" 
            type="button" 
            onClick={onSkip}
            disabled={disabled}
          >
            skip
          </button>
        )}

        <button 
          className="input-bar-send-btn" 
          type="button" 
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Send Message"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InputBar;
