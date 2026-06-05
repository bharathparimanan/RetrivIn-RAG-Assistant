import React, { useState, useEffect } from 'react';
import { listDocuments } from '../../lib/api';
import './DocumentSelectorModal.css';

interface Document {
  document_id: string;
  filename: string;
  status: string;
  doc_type: string;
}

interface Props {
  mode: string;
  targetRole: string;
  onConfirm: (selectedIds: string[]) => void;
  onClose: () => void;
}

const DocumentSelectorModal: React.FC<Props> = ({
  mode,
  targetRole,
  onConfirm,
  onClose
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments()
      .then(docs => {
        const ready = docs.filter(d => d.status === 'ready');
        setDocuments(ready);
        setSelected(ready.map(d => d.document_id));
      })
      .finally(() => setLoading(false));
  }, []);

  // Poll document status every 3 seconds while modal is open
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const docs = await listDocuments();
        const ready = docs.filter(d => d.status === 'ready');
        setDocuments(ready);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleDoc = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const modeLabel = (m: string) => {
    if (m === 'trainer') return 'Learn';
    if (m === 'introspect') return 'Prepare';
    return 'Question';
  };

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div className="doc-modal-card" onClick={e => e.stopPropagation()}>

        <div className="doc-modal-header">
          <div className="doc-modal-mode-badge">{modeLabel(mode)}</div>
          <h2 className="doc-modal-title">Select documents</h2>
          <p className="doc-modal-sub">
            {targetRole || 'Your session'} · {selected.length} selected
          </p>
        </div>

        <div className="doc-modal-list">
          {loading && (
            <p className="doc-modal-empty">Loading documents...</p>
          )}
          {!loading && documents.length === 0 && (
            <p className="doc-modal-empty">
              No ready documents found.{' '}
              <span>Upload a PDF on the Documents page first.</span>
            </p>
          )}
          {documents.map(doc => (
            <div
              key={doc.document_id}
              className={`doc-modal-item ${selected.includes(doc.document_id) ? 'selected' : ''}`}
              onClick={() => toggleDoc(doc.document_id)}
            >
              <div className="doc-modal-checkbox">
                {selected.includes(doc.document_id) && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div className="doc-modal-doc-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="doc-modal-doc-info">
                <span className="doc-modal-doc-name">{doc.filename}</span>
                <span className="doc-modal-doc-type">{doc.doc_type}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="doc-modal-footer">
          <button className="doc-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="doc-modal-start"
            disabled={selected.length === 0}
            onClick={() => {
              const selectedDocs = documents.filter(d => selected.includes(d.document_id));
              const notReady = selectedDocs.filter(d => d.status !== 'ready');
              if (notReady.length > 0) {
                alert('Some documents are still processing. Please wait until all selected documents show "ready" status.');
                return;
              }
              onConfirm(selected);
            }}
          >
            Start Session →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelectorModal;
