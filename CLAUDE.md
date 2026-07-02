# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gabay** is a full-stack synagogue management system with a Python/FastAPI backend and a React/TypeScript frontend. It includes an LLM-powered Hebrew-language assistant that can perform all operations via natural language using OpenAI function calling.

## Commands

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (http://localhost:8080, Swagger at /docs)
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173 (proxies /api → backend)
npm run build      # production build
npm run lint       # ESLint
npm run preview    # serve production build locally
```

## Architecture

### Backend (`app/`)

Layered FastAPI application:

- **`app/api/v1/`** — Route handlers (`synagogue.py`, `llm.py`); thin, delegate to services
- **`app/services/`** — Business logic (`synagogue_service.py`, `llm_service.py`)
- **`app/models/db_models.py`** — SQLModel table definitions (Congregant, Payment, Aliya, Place, Azkara, Simcha)
- **`app/core/`** — Cross-cutting concerns: `config.py` (pydantic-settings), `db.py` (SQLite via SQLModel/SQLAlchemy), `llm.py` (OpenAI client factory), `hebrew_date.py` (pyluach wrappers)

All API responses use a shared envelope: `{ success: bool, message: str, data: ... }` defined in `app/models/base.py`.

### Frontend (`frontend/src/`)

- **`api/client.ts`** — Centralized API client; exports domain-namespaced objects (`congregantsApi`, `paymentsApi`, `seatingApi`, `aliyotApi`, `azkarotApi`, `smachotApi`, `llmApi`, `calendarApi`)
- **`pages/`** — One page per domain (Congregants, Payments, Seating, Aliyot, Azkarot, Smachot, Calendar, Import, Chat)
- **`components/layout/`** — Shell layout (Layout, Sidebar)
- **`components/ui/`** — Shared reusable components

State management: **TanStack Query (React Query)** for all server state; React local state for UI-only state. No global client-side store.

### LLM Integration

The chat interface (`/llm/chat`) uses OpenAI function calling:
1. `llm_service.py` defines ~20 tools as JSON Schema objects
2. The LLM receives a Hebrew system prompt + tool list and decides which tools to call
3. Tool calls are resolved back to `synagogue_service.py` methods
4. The provider is configurable: OpenAI, Azure OpenAI, or Ollama via `LLM_BASE_URL`

### Dev Proxy

Vite proxies all `/api` requests to `http://localhost:8080`, so the frontend only needs to call `/api/v1/...` regardless of environment.

## Configuration

Copy `.env.example` to `.env` and set:

```ini
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=sk-...
# Optional:
# LLM_BASE_URL=...         # for Azure/Ollama
# DATABASE_URL=postgresql+psycopg2://...   # defaults to sqlite:///./gabay.db
# CORS_ORIGINS=["http://localhost:3000"]
```

All settings are defined in `app/core/config.py` (Pydantic Settings).

## Key Conventions

- **Hebrew date support:** All yahrzeit/simcha records store both a Gregorian and a Hebrew date. Use `hebrew_date.py` utilities (wrapping pyluach) for conversions; do not reimplement.
- **Soft deletes:** Congregants use an `archived` flag instead of hard deletes. Bulk archive/restore endpoints exist.
- **Bulk operations:** Most entities support a `POST .../bulk-delete` endpoint accepting a list of IDs.
- **Import:** Congregants can be bulk-imported from CSV or Google Sheets (`/synagogue/congregants/bulk/csv` and `/bulk/sheets`). CSV headers support Hebrew column names.
- **Database:** Default is SQLite (`gabay.db` in repo root). Switch to PostgreSQL by setting `DATABASE_URL` — no code changes needed.

## Design Standards

All UI changes must follow the **Modern Gabay Design System**:
- **Style:** Modern, clean, and spiritual. Use `rounded-xl` for cards and `rounded-lg` for buttons.
- **Colors:** Primary: Deep Indigo (`#2E3A59`), Secondary: Muted Gold (`#C5A059`), Background: `#F8FAFC`.
- **RTL:** Full support for Hebrew (RTL). Use `dir="rtl"` and `text-right`.
- **Components:** Always use components from `frontend/src/components/ui/`. Avoid raw HTML elements.
- **Feedback:** Use loading states and success/error notifications for all actions.
