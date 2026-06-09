# RetrivIn

**AI-powered interview preparation platform built on Retrieval-Augmented Generation.**

RetrivIn ingests your documents — resume, job descriptions, study notes — and uses them to generate targeted interview questions grounded in your actual experience. Every question traces back to something you wrote. No generic question banks. No hallucinated feedback.

---

## What It Does

Upload your resume. Select a target role. RetrivIn retrieves the most semantically relevant chunks from your documents, assembles a grounded context window, and calls Claude to generate 10 interview questions that only a system that read your resume could ask.

Answer all 10. Submit. Get a report card with scores, weak areas, and recommendations.

---

## Three Modes

| Mode | Name | Purpose |
|------|------|---------|
| `trainer` | Learn | 10 grounded questions from your documents. Tests whether you understand what you claim to know. |
| `introspect` | Prepare | Exposes blind spots — questions you haven't prepared for but should have. |
| `retrospective` | Question | First-principles analysis of your actual experience. Forces the why behind every decision. |

---

## Architecture
retrivin/
├── frontend/        React 18 + Vite + TypeScript + plain CSS
├── backend/         FastAPI — auth, sessions, document management
├── pipeline/        RAG brain — ingestion, retrieval, generation, evaluation
├── evaluation/      RAGAS evaluation framework + golden sets
├── mcp/             MCP tool servers — LinkedIn, GitHub connectors (Phase 3)
├── infra/           Docker Compose, nginx, environment configs
└── docs/            Architecture decisions, data flow, ADRs

### How It Works
INGESTION (async, triggered on upload)
PDF → pdfplumber → cleaner → chunker (512w, 64 overlap)
→ sentence-transformers (all-MiniLM-L6-v2, 384-dim)
→ Qdrant (per-user collection, cosine similarity)
GENERATION (async, triggered on session start)
target_role query → embed → ANN search (top-8 chunks, score ≥ 0.3)
→ mode-specific prompt template
→ Claude claude-haiku-4-5 → 10 structured questions
→ PostgreSQL session store
EVALUATION (on session complete)
10 answers + source chunks → batch evaluation prompt → Claude
→ score per question (0–10) + feedback + weak areas
→ report card stored in PostgreSQL

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, plain CSS |
| Backend API | FastAPI, SQLAlchemy async, PostgreSQL |
| Vector DB | Qdrant Cloud |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 |
| LLM | Anthropic Claude (claude-haiku-4-5-20251001) |
| Document parsing | pdfplumber, python-docx |
| Evaluation | RAGAS |
| Auth | JWT (HS256) + bcrypt |
| Containerisation | Docker + Docker Compose |
| Frontend deploy | Vercel |
| Backend deploy | Railway |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Qdrant Cloud account (free tier) — [cloud.qdrant.io](https://cloud.qdrant.io)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# set VITE_API_URL=http://localhost:8000
npm run dev
```

Runs at `http://localhost:5173`

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# fill in ANTHROPIC_API_KEY, QDRANT_URL, QDRANT_API_KEY
uvicorn app.main:app --reload --port 8000
```

Runs at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

### Full Stack (Docker)

```bash
cd infra
cp .env.example .env
# fill in all required values
docker compose up --build
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=sqlite+aiosqlite:///./retrivin.db
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=uploads
ANTHROPIC_API_KEY=your-anthropic-api-key
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
APP_ENV=development
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

---

## API Reference

### Auth
POST /auth/register    { email, password } → { access_token }
POST /auth/login       { email, password } → { access_token }

### Documents
POST /documents/upload              multipart/form-data (PDF only) → { document_id, status }
GET  /documents/                    → [{ document_id, filename, status, doc_type }]
GET  /documents/{id}/status         → { document_id, status }

### Sessions
POST /sessions/                     { mode, target_role, document_ids } → { session_id, status }
GET  /sessions/{id}                 → { session_id, status, questions[] }
POST /sessions/{id}/answers         { question_id, answer_text } → { answer_id }

### Reports
GET  /reports/{session_id}          → { overall_score, questions[], weak_areas, recommendations }
All endpoints except auth require `Authorization: Bearer {token}` header.

---

## RAG Pipeline Details

### Chunking Strategy

Fixed-size word chunking with overlap:
- **Chunk size:** 512 words
- **Overlap:** 64 words
- **Rationale:** overlap prevents semantic loss at chunk boundaries. A sentence spanning two chunks retains context in both.
- **Known limitation:** token-based chunking for resumes is suboptimal. Section-aware chunking (experience / skills / education as semantic units) is a Phase 2 improvement.

### Embedding

- **Model:** `all-MiniLM-L6-v2` via sentence-transformers
- **Dimension:** 384
- **Normalisation:** L2-normalised — required for cosine similarity correctness
- **Loading:** singleton pattern — model loaded once per process, reused across requests

### Vector Storage

- **Per-user collections:** `retrivin_user_{user_id}` — no cross-user retrieval possible by construction
- **Payload indexes:** `document_id` and `user_id` indexed as KEYWORD — required for filtered ANN search
- **Upsert semantics:** idempotent ingestion — re-uploading a document overwrites existing vectors

### Retrieval

- **Query:** role-based semantic probe — `"experience skills {target_role} technical background projects"`
- **Top-k:** 8 chunks
- **Score threshold:** 0.3 (cosine similarity)
- **Filter:** scoped to session-selected document IDs

### LLM Abstraction

The LLM client is fully abstracted in `pipeline/llm/client.py`. Switch providers by changing one environment variable:

```env
LLM_PROVIDER=anthropic   # or openai, azure_openai, groq
LLM_API_KEY=your-key
LLM_MODEL=claude-haiku-4-5-20251001
```

No code changes required to switch providers.

---

## Evaluation

RetrivIn uses RAGAS for automated RAG quality measurement:

| Metric | Target | What it measures |
|--------|--------|-----------------|
| Context Recall | > 0.75 | Retrieved chunks relevant to the question |
| Faithfulness | > 0.80 | Questions grounded in retrieved context |
| Answer Relevance | Relative | User's answer addresses the question |
| Answer Groundedness | Relative | Answer supported by source documents |

Golden sets live in `evaluation/golden_sets/`. Run evaluation:

```bash
cd evaluation
python runners/run_ragas.py
```

---

## Deployment

### Frontend — Vercel

Connect the `retrivin` repo to Vercel. Set root directory to `frontend`. Framework: Vite.

The `frontend/vercel.json` handles SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend — Railway

```bash
cd backend
railway login
railway init
railway up
```

Set environment variables in Railway dashboard. The `backend/Dockerfile` handles the rest.

### Database

- **Development:** SQLite via aiosqlite (zero config)
- **Production:** PostgreSQL — set `DATABASE_URL=postgresql+asyncpg://...` in Railway environment

---

## Development Phases

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 1 | ✅ Complete | Frontend prototype — Login, Landing, Session, Documents, Reports |
| Phase 2 | ✅ Complete | Backend + RAG pipeline — ingestion, retrieval, generation, evaluation |
| Phase 3 | 🔄 In Progress | Report card, batch evaluation, session history |
| Phase 4 | 📋 Planned | MCP connectors — LinkedIn, GitHub sourcing |
| Phase 5 | 📋 Planned | Adaptive difficulty, knowledge graph, voice input |

---

## Known Limitations

- Chunking is word-count based, not section-aware — resume sections are not treated as semantic units
- No reranking layer — cross-encoder reranking would improve retrieval precision
- No distributed tracing on RAG call chains
- Single embedding model with no versioning strategy
- Synchronous Anthropic client inside async background task — should use async client for throughput

---

## Project Structure Detail
backend/
├── app/
│   ├── main.py                    FastAPI app, CORS, lifespan
│   ├── core/
│   │   ├── config.py              Pydantic settings, env var loading
│   │   ├── database.py            SQLAlchemy async engine + session
│   │   └── security.py            JWT + bcrypt
│   └── modules/
│       ├── auth/                  Register, login endpoints
│       ├── documents/             Upload, status, list endpoints
│       ├── sessions/              Session lifecycle, question storage
│       └── evaluation/            RAGAS wrappers, report generation
│
pipeline/
├── ingestion/
│   ├── parser.py                  pdfplumber PDF → text
│   ├── cleaner.py                 Text normalisation
│   ├── chunker.py                 512-word chunks, 64-word overlap
│   ├── embedder.py                sentence-transformers inference
│   ├── vector_store.py            Qdrant client, collection management
│   └── runner.py                  Full ingestion orchestration
├── retrieval/
│   └── retriever.py               ANN search, payload filtering
├── generation/
│   ├── generator.py               LLM call, JSON parsing
│   └── prompts.py                 Mode-specific prompt templates
└── llm/
├── client.py                  Abstract LLM interface
├── anthropic.py               Anthropic implementation
└── openai.py                  OpenAI implementation

---

## Contributing

This is an active project. If you're building on top of RetrivIn or want to contribute:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing module pattern — router + service + models per domain
4. Add tests in `backend/tests/` for any pipeline changes
5. Run RAGAS evaluation before submitting pipeline changes
6. Open a PR with a clear description of what changed and why

---

## License

MIT

---

*Built by Bharath Parimanan — MSc Data Science, University of Hertfordshire*
*RAG pipeline informed by dissertation research on retrieval quality evaluation across 63,000 paragraph nodes*