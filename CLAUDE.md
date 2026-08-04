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
  - `auth/`, `congregants/`, `payments/`, `aliyot/`, `seating/`, `azkarot/`, `smachot/`, `calendar/`, `llm/`
- **`app/core/registry.py`** — `ModuleRegistry` + `ModuleDefinition`; `main.py` registers all modules here.
- **`app/core/hooks.py`** — Async event bus (`hooks.register`, `hooks.fire`) for inter-module communication.
- **`app/core/tenant.py`** — `TenantConfig` SQLModel table (name, logo, colours, enabled_modules).
- **`app/core/`** — Cross-cutting: `config.py` (pydantic-settings + `ENABLED_MODULES`), `db.py`, `llm.py`, `hebrew_date.py`
- **`app/api/v1/config.py`** — `GET/PATCH /api/v1/config` – tenant configuration endpoint.
- **`app/models/db_models.py`** — Backward-compat shim; re-exports all models from their modules.
- **`app/services/synagogue_service.py`** — Backward-compat facade; delegates to module services.

**Loading order in `main.py`:** imports all `module.py` files → each registers itself with the global `registry` → `main.py` mounts only the modules listed in `settings.ENABLED_MODULES`.

All API responses use a shared envelope: `{ success: bool, message: str, data: ... }` defined in `app/models/base.py`.

### Roles, identities, and authorization

- Persisted entities and permission roles are separate concepts. `User`, `Congregant`, and `TenantConfig` are records; `admin`, `gabai`, and `congregant` are the target role labels for authenticated actors.
- `TenantConfig` is presented to users as **Synagogue settings**. `GET /api/v1/config` may expose the public pre-login branding manifest; `PATCH /api/v1/config`, module/integration settings, security settings, user management, and role assignment are Admin-only.
- `admin`: user/role administration, protected Synagogue settings, integrations, security, and emergency operational access.
- `gabai`: full day-to-day operations, reports, imports, and operational LLM tools, excluding user administration and protected settings.
- `congregant`: WhatsApp-only public and own-data access. Verified phone → `Congregant` → server-enforced `congregant_id`; no registration or login `User` is required.
- The backend implements `admin`, `gabai`, and `congregant`; operational routes allow Admin/Gabai, while user administration and protected settings remain Admin-only.
- `User.congregant_id` is optional future web-account linkage. Do not require it for WhatsApp identification.
- Enforce authorization in router dependencies **and** service/database operations. Frontend visibility, WhatsApp handlers, LLM prompts, and tool-list filtering are not authorization boundaries.
- LLM tools must be selected by role/scope and re-authorized when executed. Congregant tools must query only the principal's `congregant_id`, including under prompt injection.
- Safe self-service updates may execute immediately. Sensitive identity, financial, yahrzeit, seating, or permission changes require Gabai approval and an audit trail.

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

## Learned Insights

These are patterns and decisions extracted from real development sessions on this project. Every agent working on Gabay must internalize these before writing any code.

### Registering a new module — the full checklist

When a new module is added under `app/modules/`, it must be wired up in **four** places or it will silently not appear in the UI:

1. `main.py` — import the module's `module.py` file so it self-registers with the global registry.
2. `app/core/config.py` — add the slug to `ENABLED_MODULES` default.
3. `app/core/tenant.py` — add the slug to the `ALL_MODULES` string constant.
4. **The live database** — if a `TenantConfig` row already exists in `gabay.db`, run:
   ```sql
   UPDATE tenant_config SET enabled_modules = '<full comma list including new slug>';
   ```
   Restarting the server does NOT update an existing row — the constant only initialises a missing row.

The `prayer_schedule` module was missing from `ALL_MODULES` and required this exact fix after it was built.

### Database migrations — no auto-migration

SQLModel does **not** run ALTER TABLE automatically when you add a new column. Whenever you add a field to a model, also add a migration block in `app/core/db.py`'s startup function:

```python
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE prayer_rules ADD COLUMN free_text TEXT"))
        conn.commit()
    except Exception:
        pass
```

Use a bare `except` to silently skip if the column already exists. This pattern is used for every additive migration in this codebase.

### TypeScript: always use `import type` for interfaces

A plain `import { SomeInterface }` of a TypeScript interface compiles fine but causes a runtime `SyntaxError` in Vite/esbuild because the interface is stripped at compile time but the import statement stays. Use:

```ts
import type { TenantConfig } from '../api/client'
import type { LucideIcon } from 'lucide-react'
```

This hit production twice: `TenantConfig` in `AppConfigContext.tsx` and `LucideIcon` in `Sidebar.tsx`.

### Vite module cache

After adding new exports to `client.ts` or any widely-imported module, if the browser still shows the old version after saving, stop and restart `npm run dev`. Vite's optimizer bundles dependencies at startup and can serve a stale bundle until restarted.

### Windows terminal encoding

The PowerShell terminal on Windows cannot display Hebrew UTF-8 by default. Symptoms:
- `pytest -s` prints garbled characters for Hebrew print statements.
- Python scripts that print Hebrew to stdout will raise `UnicodeEncodeError: 'charmap'`.

Fix in `tests/conftest.py`:
```python
import sys
sys.stdout.reconfigure(encoding='utf-8')
```

For one-off scripts, prefix with `$env:PYTHONIOENCODING='utf-8'` in PowerShell.

### CSS/Tailwind conflicts with the Button component

When combining the shared `Button` component's `variant` prop (e.g., `variant="danger"`) with additional Tailwind `className` color utilities on the same element, Tailwind's class ordering can make the variant's styles win over your overrides. Instead of fighting this, use a plain `<button>` HTML element with inline styles when you need to override colors in a modal confirmation bar or overlay context.

### pyluach Hebrew calendar conventions

- 1 Tishrei 5786 = **September 23, 2025** — not the 22nd. The Hebrew day begins at nightfall; pyluach's `HebrewDate` refers to the calendar day (starts at nightfall of the prior Gregorian day).
- `Month` has no `monthlen()` or `month_lengths` attribute. Iterate with `month.iterdates()`.
- `Year.itermonths()` starts at Tishrei (month 7), not Nisan (month 1).
- All Hebrew date logic lives in `app/core/hebrew_date.py`. Never add conversion logic elsewhere.

### Prayer schedule module — known gotchas

The `prayer_schedule` module (`app/modules/prayer_schedule/`) is the most recently built and has the most edge cases:

- **`candle_lighting` anchor** always refers to the *next* Friday, not today or last Friday.
- **`havdalah` anchor** always refers to the *next* Saturday.
- **`update_rule` sentinel bug** (fixed): a `value is not None` guard was preventing fields from being cleared back to `None`. If a field refuses to clear, check for this pattern in `service.py`.
- **Hebcal timeout**: the "שגיאה בטעינת נתוני זמנים" error in the live preview sidebar is an external Hebcal API timeout, not a code bug. The sidebar has a retry button for this.
- **Friday display rules**: when `isFriday`, filter the daily prayers block to exclude `ערבית` and `מנחה`. Show only Shabbat prayers whose calculated time is ≥ candle lighting.
- **`no_auto_time`**: when checked, hide the anchor subtitle row in the rule list — do not show any computed time.
- **`is_lesson`**: lessons display in green. Their `notes` field is used as the lesson time descriptor ("זמן השיעור"), not as supplementary notes.
- **`day_of_week`**: 0=Sunday … 4=Thursday, 5=Friday (displayed as "ערב שבת"), 6=Saturday. `null` means every day.
- **Display order**: prayer rows in the live preview should sort by `display_order` (the user's configured drag order), not by calculated time.

### Seating map seat numbering

Seat numbers are per-row (1 … row-width), not global. The `SeatTile` must display `place.place_number` only — never `row + place_number` — because the row letter is already shown in the row header.

### Upcoming azkarot — congregant name enrichment

The `Azkara` model does not store `congregant_name`. The backend `get_upcoming_azkarot` service method joins the `Congregant` table to enrich the result. Never try to resolve the name on the frontend by calling a separate API per item.

### Button ghost variant on colored backgrounds

When a `Button` with `variant="ghost"` is placed on a colored background (e.g., inside a red confirmation bar), its text may be invisible. Replace with a plain `<button>` and explicit `bg-white text-red-600` classes (or inline style) in those cases.

### Testing

Run all tests: `python -m pytest tests/ -v -s`

Add `-s` to see Hebrew print labels. The 81 existing tests cover all core modules. After every new milestone add an integration test file under `tests/`. E2E tests (Playwright) are deferred to Milestone 5.

### LLM configuration

- Provider: OpenAI (`gpt-4o-mini`).
- `LLM_BASE_URL` must be left **empty** for the standard OpenAI endpoint. Passing an empty string (not `None`) will cause a request error.
- System prompt is in Hebrew in `app/core/config.py`.
- The `llm_client` is a module-level singleton — restart the server after changing `.env`.

### Workflow preferences

- Plan first (Ask/Plan mode), then confirm, then switch to Agent mode to implement.
- After every milestone: update `ROADMAP.md` and add integration tests.
- Commits: use `git add . && git commit -m "..."` — do not commit `.env` or `gabay.db`.
- When a chat gets long, the user asks "summarize for new chat" — provide a full context block they can paste as the first message.
- The user often spots bugs visually while testing in the browser. When they describe a visual problem, ask one clarifying question to confirm which element they mean before coding.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
