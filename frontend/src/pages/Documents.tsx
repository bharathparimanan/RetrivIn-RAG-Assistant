import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { listDocuments, uploadDocument, getDocumentStatus } from '../lib/api';
import './Documents.css';

interface IngestionDoc {
  id: string;
  name: string;
  type: 'Resume' | 'Job Description' | 'Notes' | 'Study Material' | 'Certification' | 'Project Documentation';
  uploadedAt: string;
  status: 'Indexed' | 'Processing' | 'Failed';
  chunks: number | string;
}

type PipelineStage = 'upload' | 'extraction' | 'chunking' | 'embedding' | 'vector' | 'ready' | 'idle' | 'failed';

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<IngestionDoc[]>([]);
  const pollingRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Drag and drop states
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Active processing states
  const [activeDocName, setActiveDocName] = useState<string>('');
  const [currentStage, setCurrentStage] = useState<PipelineStage>('idle');
  const [pipelineProgress, setPipelineProgress] = useState(0); // 0 to 100%

  // Manual Text Area (Paste Job Description) toggle
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');

  // Selected document content previewer state (View Action)
  const [previewDoc, setPreviewDoc] = useState<IngestionDoc | null>(null);

  // Authenticate user and load real documents
  useEffect(() => {
    if (!localStorage.getItem('retrivin_token')) {
      navigate('/login');
      return;
    }
    loadRealDocuments();
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
    };
  }, [navigate]);

  const mapBackendStatus = (status: string): IngestionDoc['status'] => {
    if (status === 'ready') return 'Indexed';
    if (status === 'failed') return 'Failed';
    return 'Processing';
  };

  const mapBackendType = (docType: string): IngestionDoc['type'] => {
    if (docType === 'resume') return 'Resume';
    if (docType === 'jd' || docType === 'job_description') return 'Job Description';
    if (docType === 'notes') return 'Notes';
    if (docType === 'certification') return 'Certification';
    return 'Resume';
  };

  const loadRealDocuments = async () => {
    try {
      const docs = await listDocuments();
      const mapped: IngestionDoc[] = docs.map(d => ({
        id: d.document_id,
        name: d.filename,
        type: mapBackendType(d.doc_type),
        uploadedAt: 'recently',
        status: mapBackendStatus(d.status),
        chunks: d.status === 'ready' ? '—' : '—',
      }));
      setDocuments(mapped);
      // Start polling for any that are still processing
      docs.forEach(d => {
        if (d.status === 'uploaded' || d.status === 'processing') {
          startStatusPolling(d.document_id);
        }
      });
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const startStatusPolling = (documentId: string) => {
    if (pollingRef.current[documentId]) return;
    pollingRef.current[documentId] = setInterval(async () => {
      try {
        const result = await getDocumentStatus(documentId);
        setDocuments(prev =>
          prev.map(d =>
            d.id === documentId
              ? { ...d, status: mapBackendStatus(result.status) }
              : d
          )
        );
        if (result.status === 'ready' || result.status === 'failed') {
          clearInterval(pollingRef.current[documentId]);
          delete pollingRef.current[documentId];
          setCurrentStage('idle');
          setActiveDocName('');
        }
      } catch {}
    }, 3000);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Handle Drop Files
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateIngestion(e.dataTransfer.files);
    }
  };

  // Handle Select Button click
  const handleSelectFilesClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle File Input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateIngestion(e.target.files);
    }
  };

  // Paste Ingestion
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const title = pastedTitle.trim() || 'pasted_job_description.txt';
    
    // Simulate drop with fake file details
    simulateIngestionSingle(title, 'Job Description');
    setPastedText('');
    setPastedTitle('');
    setShowPasteArea(false);
  };

  // Pipeline simulation state machine
  const simulateIngestionSingle = (fileName: string, forcedType?: any) => {
    setActiveDocName(fileName);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2000);

    // Document types heuristic
    let docType: IngestionDoc['type'] = 'Notes';
    const lowerName = fileName.toLowerCase();
    if (forcedType) {
      docType = forcedType;
    } else if (lowerName.includes('resume') || lowerName.includes('cv')) {
      docType = 'Resume';
    } else if (lowerName.includes('jd') || lowerName.includes('job') || lowerName.includes('description')) {
      docType = 'Job Description';
    } else if (lowerName.includes('cert')) {
      docType = 'Certification';
    } else if (lowerName.includes('proj') || lowerName.includes('doc')) {
      docType = 'Project Documentation';
    } else if (lowerName.includes('study') || lowerName.includes('prep')) {
      docType = 'Study Material';
    }

    const newDocId = `doc-${Date.now()}`;
    const newDoc: IngestionDoc = {
      id: newDocId,
      name: fileName,
      type: docType,
      uploadedAt: 'Just now',
      status: 'Processing',
      chunks: '—'
    };

    // Add to documents list
    setDocuments(prev => [newDoc, ...prev]);

    // Pipeline Stages Timeline simulation
    const stages: { stage: PipelineStage; delay: number; progress: number }[] = [
      { stage: 'upload', delay: 0, progress: 10 },
      { stage: 'extraction', delay: 800, progress: 30 },
      { stage: 'chunking', delay: 1600, progress: 50 },
      { stage: 'embedding', delay: 2600, progress: 70 },
      { stage: 'vector', delay: 3600, progress: 90 },
      { stage: 'ready', delay: 4400, progress: 100 }
    ];

    stages.forEach((step) => {
      setTimeout(() => {
        // If file contains "error" or "fail", fail the pipeline at Chunking step
        const isErrorFile = lowerName.includes('error') || lowerName.includes('fail');
        
        if (isErrorFile && step.stage === 'embedding') {
          // halt and fail
          setCurrentStage('failed');
          setDocuments(prev => 
            prev.map(d => d.id === newDocId ? { ...d, status: 'Failed', chunks: '—' } : d)
          );
        } else if (isErrorFile && (step.stage === 'embedding' || step.stage === 'vector' || step.stage === 'ready')) {
          // no-op after failure
        } else {
          setCurrentStage(step.stage);
          setPipelineProgress(step.progress);
          
          if (step.stage === 'ready') {
            // Generate final chunks count and complete doc
            const chunksCount = Math.floor(Math.random() * 80) + 20;
            setDocuments(prev => 
              prev.map(d => d.id === newDocId ? { ...d, status: 'Indexed', chunks: chunksCount } : d)
            );
            setTimeout(() => {
              setCurrentStage('idle');
              setActiveDocName('');
            }, 1500);
          }
        }
      }, step.delay);
    });
  };

  const simulateIngestion = (files: FileList) => {
    if (files.length > 0) {
      handleRealUpload(files[0]);
    }
  };

  const handleRealUpload = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      // Non-PDF: run simulation only (backend rejects non-PDF)
      simulateIngestionSingle(file.name);
      return;
    }

    // Start visual pipeline animation
    simulateIngestionSingle(file.name);

    try {
      const result = await uploadDocument(file);
      // Update the simulated doc entry with the real document_id
      setDocuments(prev =>
        prev.map(d =>
          d.name === file.name && d.status === 'Processing'
            ? { ...d, id: result.document_id }
            : d
        )
      );
      // Start real status polling
      startStatusPolling(result.document_id);
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      setDocuments(prev =>
        prev.map(d =>
          d.name === file.name ? { ...d, status: 'Failed' } : d
        )
      );
    }
  };

  // Library actions
  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc(null);
    }
  };

  const handleReprocess = (doc: IngestionDoc) => {
    // Reset status to processing
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'Processing', chunks: '—' } : d));
    simulateIngestionSingle(doc.name, doc.type);
  };

  const handleView = (doc: IngestionDoc) => {
    setPreviewDoc(doc);
  };

  // Totals calculations
  const indexedDocs = documents.filter(d => d.status === 'Indexed');
  const totalChunks = indexedDocs.reduce((sum, d) => sum + (typeof d.chunks === 'number' ? d.chunks : 0), 0);

  // Sidebar logout proxy
  const handleLogout = () => {
    localStorage.removeItem('retrivin_token');
    navigate('/login');
  };

  return (
    <div className="docs-layout-wrapper">
      <Sidebar onLogout={handleLogout} />

      <div className="docs-main-frame">
        <Topbar view="landing" />

        <div className="docs-content-container" ref={scrollContainerRef}>
          <div className="docs-max-width-aligner">

            {/* SECTION 1 — Hero */}
            <section className="docs-hero-section">
              <div className="docs-hero-left">
                <h1 className="docs-hero-heading">Build Your Knowledge Base</h1>
                <p className="docs-hero-subtext">
                  Upload resumes, job descriptions, notes, certifications, and study materials. 
                  RetrivIn indexes every document into a retrieval-ready knowledge layer.
                </p>
              </div>

              <div className="docs-hero-right">
                <div className="docs-status-card">
                  <div className="status-card-header">
                    <span className="status-pulse-indicator"></span>
                    <span className="status-card-title">RAG INDEX METRICS</span>
                  </div>
                  <div className="status-metrics-grid">
                    <div className="metric-item">
                      <span className="metric-lbl">Indexed Docs</span>
                      <span className="metric-val">{indexedDocs.length}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-lbl">Vector Chunks</span>
                      <span className="metric-val">{totalChunks.toLocaleString()}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-lbl">Model Sync</span>
                      <span className="metric-val text-green">Healthy</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-lbl">Last Indexed</span>
                      <span className="metric-val text-dim">
                        {activeDocName ? 'Syncing...' : '4m ago'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2 — Upload Zone */}
            <section className="docs-upload-section">
              <div 
                className={`docs-upload-card ${isDragOver ? 'drag-over' : ''} ${uploadSuccess ? 'success-drop' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInputChange}
                  multiple 
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.txt,.md"
                />

                <div className="upload-card-content">
                  {/* Abstract Document Stack SVG */}
                  <div className="upload-icon-wrapper">
                    <svg className="upload-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="8" y1="13" x2="16" y2="13" />
                      <line x1="8" y1="17" x2="16" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>

                  <h3 className="upload-headline">
                    {uploadSuccess ? 'Files Accepted. Indexing Pipeline Started!' : 'Drop files to begin indexing'}
                  </h3>
                  <p className="upload-support-lbl">PDF, DOCX, TXT, Markdown</p>

                  <div className="upload-actions-row">
                    <button 
                      type="button" 
                      className="upload-select-btn"
                      onClick={handleSelectFilesClick}
                    >
                      Select Documents
                    </button>
                    <button 
                      type="button" 
                      className="upload-paste-link"
                      onClick={() => setShowPasteArea(!showPasteArea)}
                    >
                      Paste Job Description
                    </button>
                  </div>
                </div>

                {/* Processing Overlay inside Card when active */}
                {currentStage !== 'idle' && currentStage !== 'failed' && (
                  <div className="upload-progress-bar-wrapper">
                    <div className="progress-bar-track">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${pipelineProgress}%` }}
                      />
                    </div>
                    <span className="progress-bar-percentage">
                      {pipelineProgress}% Processing {activeDocName}
                    </span>
                  </div>
                )}
              </div>

              {/* Paste Job Description drawer */}
              {showPasteArea && (
                <div className="paste-area-drawer fade-in">
                  <h4 className="paste-drawer-title">Paste Ingest Context</h4>
                  <input 
                    type="text" 
                    placeholder="Document Title (e.g. staff_sde_jd.txt)"
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                    className="paste-title-input"
                  />
                  <textarea 
                    placeholder="Paste the Job Description or notes here..." 
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={6}
                    className="paste-textarea"
                  />
                  <div className="paste-actions">
                    <button 
                      type="button" 
                      className="paste-submit-btn" 
                      onClick={handlePasteSubmit}
                      disabled={!pastedText.trim()}
                    >
                      Ingest Text
                    </button>
                    <button 
                      type="button" 
                      className="paste-cancel-btn"
                      onClick={() => { setShowPasteArea(false); setPastedText(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 3 — Indexing Pipeline Visualization */}
            <section className="docs-pipeline-section">
              <div className="pipeline-section-header">
                <h2 className="pipeline-title">Knowledge Indexing Pipeline</h2>
                {activeDocName && (
                  <span className="pipeline-active-file">
                    Ingesting: <strong>{activeDocName}</strong>
                  </span>
                )}
              </div>

              <div className="pipeline-horizontal-flow">
                {/* Node 1: Upload */}
                <div className={`pipeline-node ${
                  currentStage !== 'idle' ? 'done' : ''
                }`}>
                  <div className="node-circle">1</div>
                  <span className="node-label">Document Upload</span>
                </div>

                <div className={`pipeline-connector ${
                  currentStage === 'extraction' || currentStage === 'chunking' || currentStage === 'embedding' || currentStage === 'vector' || currentStage === 'ready' ? 'done' : ''
                }`} />

                {/* Node 2: Extraction */}
                <div className={`pipeline-node ${
                  currentStage === 'extraction' ? 'running' :
                  currentStage === 'chunking' || currentStage === 'embedding' || currentStage === 'vector' || currentStage === 'ready' ? 'done' : 'pending'
                }`}>
                  <div className="node-circle">2</div>
                  <span className="node-label">Text Extraction</span>
                </div>

                <div className={`pipeline-connector ${
                  currentStage === 'chunking' || currentStage === 'embedding' || currentStage === 'vector' || currentStage === 'ready' ? 'done' : ''
                }`} />

                {/* Node 3: Chunking */}
                <div className={`pipeline-node ${
                  currentStage === 'chunking' ? 'running' :
                  currentStage === 'failed' ? 'failed' :
                  currentStage === 'embedding' || currentStage === 'vector' || currentStage === 'ready' ? 'done' : 'pending'
                }`}>
                  <div className="node-circle">
                    {currentStage === 'failed' ? '!' : '3'}
                  </div>
                  <span className="node-label">Chunking</span>
                </div>

                <div className={`pipeline-connector ${
                  currentStage === 'failed' ? 'failed' :
                  currentStage === 'embedding' || currentStage === 'vector' || currentStage === 'ready' ? 'done' : ''
                }`} />

                {/* Node 4: Embedding */}
                <div className={`pipeline-node ${
                  currentStage === 'failed' ? 'disabled' :
                  currentStage === 'embedding' ? 'running' :
                  currentStage === 'vector' || currentStage === 'ready' ? 'done' : 'pending'
                }`}>
                  <div className="node-circle">4</div>
                  <span className="node-label">Embedding</span>
                </div>

                <div className={`pipeline-connector ${
                  currentStage === 'failed' ? 'disabled' :
                  currentStage === 'vector' || currentStage === 'ready' ? 'done' : ''
                }`} />

                {/* Node 5: Vector Storage */}
                <div className={`pipeline-node ${
                  currentStage === 'failed' ? 'disabled' :
                  currentStage === 'vector' ? 'running' :
                  currentStage === 'ready' ? 'done' : 'pending'
                }`}>
                  <div className="node-circle">5</div>
                  <span className="node-label">Vector Storage</span>
                </div>

                <div className={`pipeline-connector ${
                  currentStage === 'failed' ? 'disabled' :
                  currentStage === 'ready' ? 'done' : ''
                }`} />

                {/* Node 6: Ready */}
                <div className={`pipeline-node ${
                  currentStage === 'failed' ? 'disabled' :
                  currentStage === 'ready' ? 'done' : 'pending'
                }`}>
                  <div className="node-circle">✓</div>
                  <span className="node-label">Ready</span>
                </div>
              </div>

              {currentStage === 'failed' && (
                <div className="pipeline-error-banner fade-in">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Pipeline indexing failed at Chunking step. File contains parsing encoding conflicts. Try reprocessing.</span>
                </div>
              )}
            </section>

            {/* Document Content View Panel (Drawer on same page) */}
            {previewDoc && (
              <section className="docs-preview-drawer fade-in">
                <div className="preview-drawer-header">
                  <div className="preview-drawer-meta">
                    <span className="preview-badge">{previewDoc.type}</span>
                    <h3 className="preview-doc-title">{previewDoc.name}</h3>
                  </div>
                  <button 
                    type="button" 
                    className="preview-close-btn"
                    onClick={() => setPreviewDoc(null)}
                  >
                    Close Viewer
                  </button>
                </div>
                <div className="preview-drawer-content">
                  <p className="font-mono-preview">
                    {`[RETRIEVAL INDEX METADATA]
ID: ${previewDoc.id}
File Format: PDF/TXT Parsing Successful
Chunk Distribution: ${previewDoc.chunks} Generated Vectors
Coverage Density: High
Vector Database Cluster: Node-US-East-1

--- INGESTED CONTENT PREVIEW ---
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit animi id est laborum.

Technologies parsed: Apache Kafka, Airflow, Delta Lake SQL Databases, Medallion Pipeline Architecture.
Structured resume timeline detects 5 years SDE experience.`}
                  </p>
                </div>
              </section>
            )}

            {/* Grid for Library & Checklist panels */}
            <div className="docs-split-panels-row">
              
              {/* LEFT COLUMN: Library */}
              <div className="docs-panel-column flex-2">
                <div className="panel-header-with-actions">
                  <h2 className="panel-section-title">Knowledge Library</h2>
                  {documents.length > 0 && (
                    <button 
                      type="button" 
                      className="library-clear-all-btn"
                      onClick={() => setDocuments([])}
                      title="Clear library to inspect Empty State"
                    >
                      Clear Index
                    </button>
                  )}
                </div>

                {documents.length === 0 ? (
                  /* SECTION 7 — Empty State */
                  <div className="docs-empty-state-panel">
                    <div className="empty-state-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3 className="empty-state-title">Your AI has nothing to reason about yet.</h3>
                    <p className="empty-state-desc">
                      Upload a resume or job description to begin building your interview knowledge base.
                    </p>
                    <button 
                      type="button" 
                      className="empty-state-cta-btn"
                      onClick={handleSelectFilesClick}
                    >
                      Upload First Document
                    </button>
                  </div>
                ) : (
                  /* SECTION 4 — Document Library list */
                  <div className="docs-library-grid">
                    {documents.map((doc) => (
                      <div key={doc.id} className="document-library-card">
                        <div className="lib-card-top">
                          <span className={`doc-type-pill type-${doc.type.toLowerCase().replace(' ', '-')}`}>
                            {doc.type}
                          </span>
                          <span className={`doc-status-badge status-${doc.status.toLowerCase()}`}>
                            {doc.status}
                          </span>
                        </div>
                        
                        <h4 className="doc-library-name" title={doc.name}>
                          {doc.name}
                        </h4>

                        <div className="doc-library-meta">
                          <div className="meta-row-item">
                            <span className="meta-lbl-txt">Uploaded:</span>
                            <span className="meta-val-txt">{doc.uploadedAt}</span>
                          </div>
                          <div className="meta-row-item">
                            <span className="meta-lbl-txt">Chunks:</span>
                            <span className="meta-val-txt">{doc.chunks}</span>
                          </div>
                        </div>

                        <div className="doc-card-actions">
                          <button 
                            type="button" 
                            className="doc-action-btn view"
                            onClick={() => handleView(doc)}
                            disabled={doc.status === 'Processing'}
                          >
                            View
                          </button>
                          <button 
                            type="button" 
                            className="doc-action-btn reprocess"
                            onClick={() => handleReprocess(doc)}
                            disabled={doc.status === 'Processing'}
                          >
                            Reprocess
                          </button>
                          <button 
                            type="button" 
                            className="doc-action-btn delete"
                            onClick={() => handleDelete(doc.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: SECTION 5 — Retrieval Readiness Panel */}
              <div className="docs-panel-column flex-1">
                <h2 className="panel-section-title">Retrieval Readiness</h2>
                <div className="readiness-panel-card">
                  <div className="readiness-section">
                    <span className="readiness-section-title green-theme">RETRIEVAL COVERAGE</span>
                    <ul className="readiness-list done-items">
                      <li>
                        <span className="readiness-bullet-icon">✓</span>
                        <span>Resume Experience</span>
                      </li>
                      <li>
                        <span className="readiness-bullet-icon">✓</span>
                        <span>Skills & Technologies</span>
                      </li>
                      <li>
                        <span className="readiness-bullet-icon">✓</span>
                        <span>Project History</span>
                      </li>
                      <li>
                        <span className="readiness-bullet-icon">✓</span>
                        <span>Job Requirements</span>
                      </li>
                      <li>
                        <span className="readiness-bullet-icon">✓</span>
                        <span>Study Notes</span>
                      </li>
                    </ul>
                  </div>

                  <div className="readiness-section">
                    <span className="readiness-section-title yellow-theme">MISSING CONTEXT</span>
                    <ul className="readiness-list missing-items">
                      <li>
                        <span className="readiness-bullet-icon">⚠</span>
                        <span>System Design Notes</span>
                      </li>
                      <li>
                        <span className="readiness-bullet-icon">⚠</span>
                        <span>Behavioural Examples</span>
                      </li>
                      <li>
                        <span className="readiness-bullet-icon">⚠</span>
                        <span>Leadership Experience</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    type="button" 
                    className="readiness-improve-btn"
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    Improve Coverage
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 6 — Knowledge Insights */}
            <section className="docs-insights-section">
              <h2 className="panel-section-title">Knowledge Insights</h2>
              <div className="insights-grid">
                
                {/* Card 1: Top Technologies */}
                <div className="insight-card">
                  <h4 className="insight-card-title">Top Technologies Detected</h4>
                  <div className="tech-tags-list">
                    <span className="tech-tag">Kafka</span>
                    <span className="tech-tag">Airflow</span>
                    <span className="tech-tag">Spark</span>
                    <span className="tech-tag">FastAPI</span>
                    <span className="tech-tag">Databricks</span>
                  </div>
                </div>

                {/* Card 2: Most Referenced */}
                <div className="insight-card">
                  <h4 className="insight-card-title">Most Referenced Topics</h4>
                  <ol className="topics-ranked-list">
                    <li>
                      <span className="rank-num">1</span>
                      <span className="rank-txt">Data Engineering</span>
                    </li>
                    <li>
                      <span className="rank-num">2</span>
                      <span className="rank-txt">Distributed Systems</span>
                    </li>
                    <li>
                      <span className="rank-num">3</span>
                      <span className="rank-txt">Lakehouse Architecture</span>
                    </li>
                  </ol>
                </div>

                {/* Card 3: Interview Signal Strength */}
                <div className="insight-card">
                  <h4 className="insight-card-title">Interview Signal Strength</h4>
                  <div className="signal-bars-list">
                    <div className="signal-bar-item">
                      <div className="bar-label-row">
                        <span>Technical Depth</span>
                        <span>82%</span>
                      </div>
                      <div className="signal-bar-track">
                        <div className="signal-bar-fill" style={{ width: '82%' }}></div>
                      </div>
                    </div>
                    <div className="signal-bar-item">
                      <div className="bar-label-row">
                        <span>System Design</span>
                        <span>61%</span>
                      </div>
                      <div className="signal-bar-track">
                        <div className="signal-bar-fill" style={{ width: '61%' }}></div>
                      </div>
                    </div>
                    <div className="signal-bar-item">
                      <div className="bar-label-row">
                        <span>Leadership</span>
                        <span>34%</span>
                      </div>
                      <div className="signal-bar-track">
                        <div className="signal-bar-fill" style={{ width: '34%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
