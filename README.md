# RetrivIn — RAG Assistant

> An AI-powered interview prep tool that knows *you*.  
> Upload your documents. Paste a job description. Get drilled on your real skill gaps — grounded in your own knowledge.

---

## What It Does

Most interview tools give generic advice. **RetrivIn** doesn't.

It ingests your CV, portfolio, and notes. It reads the job you're targeting. It builds a knowledge graph of who you are vs what the job needs — then acts as a personal interview trainer, asking targeted questions, evaluating your answers, and drilling the gaps.

No hallucinations. No generic advice. Everything grounded in your actual documents and the actual job.

---

## Architecture

```
Documents + JD
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  INDEXING   │────▶│   STORAGE    │────▶│   QUERYING    │
│             │     │              │     │               │
│ load        │     │ FAISS        │     │ embed query   │
│ parse       │     │ NetworkX KG  │     │ vector search │
│ chunk       │     │ PostgreSQL   │     │ KG traversal  │
│ embed       │     │              │     │ merge context │
│ kg_build    │     └──────────────┘     └───────┬───────┘
└─────────────┘                                  │
                                                 ▼
                                        ┌────────────────┐
                                        │   GENERATION   │
                                        │                │
                                        │ prompt builder │
                                        │ Llama 3.2      │
                                        │ SSE stream     │
                                        └───────┬────────┘
                                                │
                                                ▼
                                        ┌────────────────┐
                                        │   INTERFACE    │
                                        │   FastAPI      │
                                        │   /docs        │
                                        └────────────────┘
```

---

## Stack

| Layer | Technology |
|---|---|
| Document Pipeline | LangChain · sentence-transformers |
| Vector Store | FAISS |
| Knowledge Graph | NetworkX → Neo4j |
| LLM | Llama 3.2 via Ollama · Groq (API swap) |
| Orchestration | Apache Airflow |
| API | FastAPI · Pydantic · JWT · SSE |
| Database | PostgreSQL |
| Observability | Langfuse |
| Evaluation | RAGAS |

---

## Project Structure

```
RetrivIn/
├── src/
│   ├── indexing/        # RAG document pipeline
│   │   ├── loader.py        # ingest + validate raw files
│   │   ├── parser.py        # extract text (PDF, DOCX, TXT)
│   │   ├── normaliser.py    # clean + fix encoding
│   │   ├── chunker.py       # RecursiveCharacterTextSplitter (512/50)
│   │   ├── embedder.py      # sentence-transformers → vectors
│   │   ├── kg_builder.py    # entity extract → NetworkX KG + GAP detection
│   │   ├── validator.py     # chunk quality + vector dimension check
│   │   └── rejected.py      # isolate bad documents / chunks
│   │
│   ├── sources/         # file-type parsers
│   │   ├── pdf_parser.py
│   │   ├── docx_parser.py
│   │   ├── txt_parser.py
│   │   └── jd_parser.py     # LinkedIn JD → structured dict
│   │
│   ├── querying/        # RAG retrieval pipeline
│   │   ├── query_embedder.py    # embed user query
│   │   ├── vector_retriever.py  # FAISS ANN search, Top-K=5
│   │   ├── kg_retriever.py      # KG traversal: skills, gaps, projects
│   │   └── context_merger.py    # merge chunks + KG → unified context
│   │
│   ├── storage/         # persistence
│   │   ├── vector_store.py      # FAISS: save, load, upsert, search
│   │   └── knowledge_graph.py   # NetworkX KG: add nodes, query, traverse
│   │
│   ├── generation/      # LLM layer
│   │   ├── prompt_builder.py    # system + KG context + chunks + query
│   │   ├── llm_client.py        # Ollama (local) / Groq (API) toggle
│   │   └── streamer.py          # SSE token stream → FastAPI response
│   │
│   ├── observability/   # tracing
│   │   ├── langfuse_client.py   # trace every pipeline step
│   │   └── tracer.py            # @trace_step decorator
│   │
│   ├── evaluation/      # quality
│   │   ├── ragas_eval.py        # faithfulness, answer_relevancy, context_recall
│   │   └── feedback_store.py    # user thumbs / comments → PostgreSQL
│   │
│   ├── interface/       # FastAPI app
│   │   ├── app.py           # mounts all routers, CORS, /health
│   │   ├── dependencies.py  # JWT decode, DB session
│   │   └── middleware.py    # request logging, error handling
│   │
│   ├── routers/         # API endpoints
│   │   ├── auth.py          # POST /auth/login
│   │   ├── upload.py        # POST /upload
│   │   ├── job.py           # POST /job
│   │   ├── query.py         # POST /query
│   │   ├── stream.py        # GET  /stream  (SSE)
│   │   ├── gaps.py          # GET  /gaps
│   │   └── feedback.py      # POST /feedback
│   │
│   ├── models/          # SQLAlchemy ORM
│   │   ├── user.py
│   │   ├── document.py
│   │   └── feedback.py
│   │
│   ├── schema/          # Pydantic contracts
│   │   ├── auth.py
│   │   ├── upload.py
│   │   ├── job.py
│   │   ├── query.py
│   │   └── feedback.py
│   │
│   ├── postgres/        # repository pattern — no raw SQL in routers
│   │   ├── user_repo.py
│   │   ├── document_repo.py
│   │   └── feedback_repo.py
│   │
│   ├── db/
│   │   └── session.py       # SQLAlchemy engine, session factory, Base
│   │
│   └── config.py            # Pydantic Settings — all env vars
│
├── airflow/
│   └── dags/
│       ├── ingestion_dag.py     # triggered on upload → full indexing pipeline
│       └── jd_fetch_dag.py      # daily LinkedIn JD ingestion
│
├── notebooks/
│   ├── 01_indexing_pipeline.ipynb
│   ├── 02_kg_exploration.ipynb
│   └── 03_retrieval_eval.ipynb
│
├── test/
│   ├── unit/                # chunker, embedder, kg_builder, sources
│   └── integration/         # upload, query, stream endpoints
│
├── assets/
│   ├── faiss_index/
│   └── 
│
├── env/
│   ├── .env.example
│   └── .env.test
│
├── scripts/
│   └── init-multiple-dbs.sh
│
├── compose.yml          # api · postgres · ollama · airflow · langfuse
├── Dockerfile
├── Makefile
├── pyproject.toml
└── .gitignore
```

---

## Knowledge Graph Model

```
User ──has──────────► Skill ──required_by──► Job
User ──built───────► Project ──demonstrates──► Skill
Job  ──needs───────► Skill
Skill ──missing_from──► User = GAP
GAP  ──generates───► InterviewQuestion
InterviewQuestion ──has_answer──► UserAnswer
UserAnswer ──receives──► Feedback
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | JWT token |
| POST | `/upload` | Trigger indexing pipeline |
| POST | `/job` | Store LinkedIn JD |
| POST | `/query` | RAG answer |
| GET | `/stream` | SSE token stream |
| GET | `/gaps` | User skill gap report |
| POST | `/feedback` | Thumbs + comments |
| GET | `/health` | Service health |

**Swagger UI:** `http://localhost:8000/docs`

---

## Quick Start

```bash
# 1. Clone and configure
git clone <repo-url>
cd RetrivIn
cp env/.env.example .env

# 2. Start all services
make start

# 3. Pull the LLM (first time only)
make pull-model

# 4. Verify
make health
```

**Services:**

| Service | URL |
|---|---|
| API + Swagger | http://localhost:8000/docs |
| Airflow | http://localhost:8080 — admin / admin |
| Langfuse | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Ollama | localhost:11434 |

---

## Development

```bash
make test        # run all tests
make test-cov    # with coverage
make lint        # ruff check
make format      # ruff format
make logs-api    # tail API logs
make nuke        # full reset — wipes all volumes
```

---

## LLM Toggle

Switch between local (free) and API (faster) in `.env`:

```bash
# Local — free, private
LLM_PROVIDER=ollama

# API — faster, needs key
LLM_PROVIDER=groq
GROQ_API_KEY=your-key-here
```

---

*Built with LangChain · FAISS · NetworkX · FastAPI · Llama 3.2*
