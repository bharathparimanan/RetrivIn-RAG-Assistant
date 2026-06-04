import React, { useState, useRef } from 'react';
import './AddSourceModal.css';

interface AddSourceModalProps {
  onClose: () => void;
  onAdd: (type: 'youtube' | 'report' | 'resource' | 'attachment', name: string) => void;
}

type TabType = 'url' | 'paste' | 'upload';

export const AddSourceModal: React.FC<AddSourceModalProps> = ({ onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [urlInput, setUrlInput] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const type = isYoutube ? 'youtube' : 'resource';
    // Clean name from URL
    let cleanName = url.replace(/https?:\/\/(www\.)?/, '').substring(0, 30);
    if (isYoutube) {
      cleanName = `YouTube — ${cleanName}`;
    } else {
      cleanName = `Link — ${cleanName}`;
    }
    onAdd(type, cleanName);
    onClose();
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    const title = pasteTitle.trim() || `Pasted Note (${new Date().toLocaleDateString()})`;
    onAdd('report', title);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAdd('attachment', file.name);
      onClose();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onAdd('attachment', file.name);
      onClose();
    }
  };

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* TABS CONTAINER */}
        <div className="search-modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            URL
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
            onClick={() => setActiveTab('paste')}
          >
            Paste
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="search-modal-content">
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="url-form">
              <div className="url-input-pill">
                <input
                  type="url"
                  required
                  placeholder="Paste a YouTube, archive, or report URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="url-field"
                />
                <button 
                  type="submit" 
                  className="url-enter-btn"
                  disabled={!urlInput.trim()}
                  title="Add source URL"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'paste' && (
            <form onSubmit={handlePasteSubmit} className="paste-form">
              <input
                type="text"
                placeholder="Source Title (optional)..."
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                className="paste-title-field"
              />
              <textarea
                rows={6}
                required
                placeholder="Paste article, transcript, or notes here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="paste-textarea-field"
              />
              <button 
                type="submit" 
                className="paste-submit-btn"
                disabled={!pasteText.trim()}
              >
                Add Note
              </button>
            </form>
          )}

          {activeTab === 'upload' && (
            <div 
              className={`upload-drop-zone ${dragOver ? 'drag' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf"
                onChange={handleFileChange}
              />
              <svg className="upload-file-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="upload-headline">Drop PDF here or click to browse</span>
            </div>
          )}
        </div>

        {/* BOTTOM CANCEL ACTION */}
        <div className="search-modal-footer">
          <button 
            type="button" 
            className="modal-close-cancel-btn" 
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSourceModal;
