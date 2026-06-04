# Retrivin — Architecture

## Layers

### Frontend
React 18 + Vite + TypeScript + plain CSS. Deployed on Netlify. Communicates with backend via REST. No direct LLM or vector DB access. Login page (`/login`) is the entry point — redirects to `/` if no token in localStorage.

### Backend (Phase 2)
FastAPI. Auth, session management, document metadata, API routing. Delegates all RAG operations to pipeline service. No ML dependencies.

### Pipeline (Phase 2)
RAG brain. Document ingestion, chunking, embedding, vector storage, question generation, answer evaluation. All ML dependencies isolated here. LLM provider set via env var — zero code changes to switch providers.

### Evaluation (Phase 2)
RAGAS. Runs independently against golden sets. Measures context recall, faithfulness, answer relevance, groundedness.

### MCP Servers (Phase 3)
LinkedIn and GitHub connectors. Standard MCP interface. Called by pipeline during sourcing.

## Data Flow (Phase 2)

### Ingestion
Upload → Backend → Pipeline
→ parser → cleaner → chunker → embedder
→ Qdrant (per-user namespace)
→ PostgreSQL document record

### Question Generation
Session start → Backend → Pipeline
→ retrieve top-k chunks
→ mode-specific prompt template
→ LLM → 10 grounded questions
→ PostgreSQL session record → frontend

### Answer Evaluation
Answer submit → Backend → Pipeline
→ retrieve source chunks
→ rubric prompt + LLM
→ score 0-10 + feedback
→ PostgreSQL → frontend

## LLM Strategy
Provider abstracted via `pipeline/llm/client.py`. LLM selection under evaluation. Supported providers: `openai`, `anthropic`, `azure_openai`, `groq`. Switch by changing `LLM_PROVIDER` env var only.
