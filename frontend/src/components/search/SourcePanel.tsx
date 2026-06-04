import React from 'react';
import type { SourceItem } from '../../types/sourcing';
import './SourcePanel.css';

interface SourcePanelProps {
  sources: SourceItem[];
  onToggleSelect: (id: string) => void;
  onToggleConnect: (type: 'linkedin' | 'github') => void;
  onOpenAddModal: () => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  sources,
  onToggleSelect,
  onToggleConnect,
  onOpenAddModal,
}) => {
  const getIcon = (type: SourceItem['type']) => {
    switch (type) {
      case 'linkedin':
        return (
          <svg className="source-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        );
      case 'github':
        return (
          <svg className="source-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="source-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-2C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
          </svg>
        );
      default:
        return (
          <svg className="source-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
    }
  };

  const isLinkedInConnected = sources.some(s => s.type === 'linkedin' && s.connected);
  const isGitHubConnected = sources.some(s => s.type === 'github' && s.connected);

  return (
    <div className="search-source-panel">
      {/* CONNECTORS SECTION */}
      <span className="search-panel-section-label">Connectors</span>
      
      <div className="search-connectors-box">
        {/* LinkedIn Row */}
        <div className="connector-row" onClick={() => onToggleConnect('linkedin')}>
          <div className="connector-row-left">
            <svg className="connector-brand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            <span className="connector-name">LinkedIn</span>
            {isLinkedInConnected && <span className="connection-green-dot" title="Platform connected" />}
          </div>
          
          <div className={`connector-toggle-switch ${isLinkedInConnected ? 'active' : ''}`}>
            <span className="toggle-switch-circle" />
          </div>
        </div>

        {/* GitHub Row */}
        <div className="connector-row" onClick={() => onToggleConnect('github')}>
          <div className="connector-row-left">
            <svg className="connector-brand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            <span className="connector-name">GitHub</span>
            {isGitHubConnected && <span className="connection-green-dot" title="Platform connected" />}
          </div>
          
          <div className={`connector-toggle-switch ${isGitHubConnected ? 'active' : ''}`}>
            <span className="toggle-switch-circle" />
          </div>
        </div>
      </div>

      <div className="search-panel-divider" />

      {/* SOURCES SECTION */}
      <span className="search-panel-section-label">Sources</span>
      
      <button 
        type="button" 
        className="search-add-source-btn"
        onClick={onOpenAddModal}
      >
        + Add Source
      </button>

      <div className="search-source-list">
        {sources.length === 0 ? (
          <p className="search-sources-empty">No sources added yet.</p>
        ) : (
          sources.map(source => (
            <div 
              key={source.id}
              className={`search-source-row ${source.selected ? 'selected' : ''}`}
              onClick={() => onToggleSelect(source.id)}
            >
              <div 
                className={`search-row-checkbox ${source.selected ? 'checked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(source.id);
                }}
              />
              <div className="search-row-icon">
                {getIcon(source.type)}
              </div>
              <span className="search-row-name" title={source.name}>
                {source.name}
              </span>
              {source.connected && (
                <span className="connection-green-dot" title="Source Ingested" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SourcePanel;
