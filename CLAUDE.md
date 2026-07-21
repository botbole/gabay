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

Modular FastAPI application (Milestone 1.5):

- **`app/modules/`** — One sub-package per domain. Each has `models.py`, `service.py`, `api.py`, `module.py`.
  - `congregants/`, `payments/`, `aliyot/`, `seating/`, `azkarot/`, `smachot/`, `calendar/`, `llm/`
- **`app/core/registry.py`** — `ModuleRegistry` + `ModuleDefinition`; `main.py` registers all modules here.
- **`app/core/hooks.py`** — Async event bus (`hooks.register`, `hooks.fire`) for inter-module communication.
- **`app/core/tenant.py`** — `TenantConfig` SQLModel table (name, logo, colours, enabled_modules).
- **`app/core/`** — Cross-cutting: `config.py` (pydantic-settings + `ENABLED_MODULES`), `db.py`, `llm.py`, `hebrew_date.py`
- **`app/api/v1/config.py`** — `GET/PATCH /api/v1/config` – tenant configuration endpoint.
- **`app/models/db_models.py`** — Backward-compat shim; re-exports all models from their modules.
- **`app/services/synagogue_service.py`** — Backward-compat facade; delegates to module services.

**Loading order in `main.py`:** imports all `module.py` files → each registers itself with the global `registry` → `main.py` mounts only the modules listed in `settings.ENABLED_MODULES`.

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
- **Colors:** Primary: Deep Indigo (`#2E3A59`), Secondary: Muted Gold (`#C5A059`), Background: `#F8FAFC`. These are defined as CSS variables: `var(--color-indigo)`, `var(--color-gold)`, `var(--color-bg)` in `frontend/src/index.css`.
- **Font:** Heebo (loaded from Google Fonts in `frontend/index.html`). Applied globally via CSS.
- **RTL:** Full support for Hebrew (RTL). The root `<html>` element has `dir="rtl"` and `lang="he"`.
- **Components:** Always use components from `frontend/src/components/ui/`. Avoid raw HTML elements. Key shared components:
  - **`PageHeader`** (`components/ui/PageHeader.tsx`) — Use at the top of every page. Accepts `title`, `subtitle`, `action`.
  - **`EmptyState`** (`components/ui/EmptyState.tsx`) — Use whenever a list or table has no data. Accepts `icon`, `title`, `description`, `action`.
  - **`Header`** (`components/layout/Header.tsx`) — Top bar showing current page title and Hebrew/Gregorian date. Already included in `Layout.tsx`.
- **Feedback:** Use loading states and success/error notifications for all actions.

## Key Architecture Decisions

- **Hook System (active – Milestone 1.5):** `app/core/hooks.py` provides an async pub/sub event bus. Services fire events (e.g., `aliya.assigned_with_donation`) and other modules can subscribe without tight coupling. Example: aliyot module fires an event; payments module auto-records the pledge.
- **Module Registry (active – Milestone 1.5):** Every feature is a self-contained module under `app/modules/`. New features must follow the same pattern. Avoid imports between modules except via lazy imports or hooks.
- **Testing convention:** After completing each milestone, add integration tests under `tests/` using `pytest` + `httpx.AsyncClient` with the in-memory SQLite fixture from `tests/conftest.py`. E2E tests (Playwright) are deferred to Milestone 5.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
