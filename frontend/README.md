# Retrivin

AI-powered interview preparation platform. Upload your resume, job descriptions, and study materials — Retrivin reasons about your specific profile, generates targeted questions, evaluates your answers, and tracks your growth over sessions.

## Modes

| Mode | Name | What it does |
|------|------|-------------|
| Trainer | Learn | Generates 10 grounded questions from your documents, scores your answers |
| Introspect | Prepare | Exposes dark areas — questions you haven't prepared for |
| Retrospective | Question | First-principles analysis of your actual experience |

## Project Structure
retrivin/
├── frontend/      React 18 + Vite + TypeScript + plain CSS
├── backend/       FastAPI — auth, sessions, API routing
├── pipeline/      RAG brain — ingestion, retrieval, generation
├── evaluation/    RAGAS quality measurement
├── mcp/           MCP tool servers — LinkedIn, GitHub
├── infra/         Docker, nginx, compose
└── docs/          Architecture decisions, data flow

## Quick Start

### Frontend only
```bash
npm install
npm run dev
```

### Full stack (Phase 2)
```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up --build
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18, Vite, TypeScript, plain CSS |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Vector DB | Qdrant |
| Embeddings | sentence-transformers |
| LLM | TBD — abstracted via pipeline/llm/client.py |
| Evaluation | RAGAS |
| Containers | Docker + Docker Compose |

## Deployment

- **Frontend** — Netlify (auto-deploy from main branch, login page is entry point)
- **Backend + Pipeline** — Docker on Railway / Render / Azure (Phase 2)

## Phases

- **Phase 1 (current)** — Frontend prototype deployed on Netlify
- **Phase 2** — Backend + RAG pipeline, full stack deploy
- **Phase 3** — MCP connectors, agentic sourcing, voice input
