# Gabay – Synagogue Management System

**גבאי** is a commercial, full-stack synagogue management system built for Hebrew-speaking communities. It replaces spreadsheets and handwritten notebooks with a modern web interface, a Hebrew LLM assistant, and a modular platform designed to run across multiple synagogues.

---

## What it does

- Manage congregants, payments, Torah aliyot, seating assignments, yahrzeits, and simchot
- Auto-generate weekly Shabbat bulletins with prayer schedule, announcements, and community events
- Calculate dynamic prayer times ("Mincha = 15 min before sunset") using live zmanim data
- Chat with the Digital Gabbai — an LLM assistant that performs any operation in Hebrew natural language
- Full Hebrew RTL interface with Hebrew calendar support throughout

---

## Architecture

Gabay follows a **Modular Monolith** pattern. Each feature is a self-contained module under `app/modules/`. Modules communicate via an async Event Bus — never via direct imports.

```
Backend:  Python 3.11+ · FastAPI · SQLModel · pyluach · OpenAI API
Frontend: React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query
Database: SQLite (default) / PostgreSQL (production)
```

**Roles in the current build:**
```
admin        → Synagogue admin     → operational pages, users, and tenant config API
gabai        → Day-to-day staff    → operational pages (no user or settings management)
congregant   → Worshipper          → scoped API only; no web sidebar
```

Planned, not in the UI yet: a Settings page for admin (v2.5), a `super_admin` `/platform` panel (v3.2), and WhatsApp self-service (v3.5). See [`ROADMAP.md`](ROADMAP.md).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the target design. The repo map and what runs today are in [`docs/hierarchy/README.md`](docs/hierarchy/README.md).

---

## Quick Start (Development)

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env: set LLM_API_KEY and optionally DATABASE_URL

# Run dev server (http://localhost:8080, Swagger at /docs)
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173 — proxies /api → backend
```

### Tests

```bash
python -m pytest tests/ -v -s
```

---

## Project Structure

```
gabay/
├── main.py                          # FastAPI entry point; registers all modules
├── requirements.txt
├── .env.example                     # All settings with documentation
├── CHANGELOG.md                     # Release notes (created at v3.1)
│
├── app/
│   ├── core/
│   │   ├── config.py                # Pydantic settings (reads from .env)
│   │   ├── db.py                    # DB engine + additive migration helpers
│   │   ├── tenant.py                # TenantConfig SQLModel (branding, LLM, zmanim)
│   │   ├── registry.py              # ModuleRegistry — dynamic module loading
│   │   ├── hooks.py                 # Async Event Bus (fire / register)
│   │   ├── hebrew_date.py           # All Hebrew calendar logic (pyluach wrapper)
│   │   ├── zmanim.py                # Prayer time calculations via Hebcal API
│   │   └── llm.py                   # LLM client (reads TenantConfig, falls back to .env)
│   │
│   ├── modules/                     # One sub-package per feature domain
│   │   ├── auth/                    # JWT auth, users, sessions, roles
│   │   ├── congregants/             # Community registry
│   │   ├── payments/                # Donations and membership fees
│   │   ├── aliyot/                  # Torah aliyah assignments
│   │   ├── seating/                 # Seat map and assignments
│   │   ├── azkarot/                 # Yahrzeit records
│   │   ├── smachot/                 # Joyous event records
│   │   ├── calendar/                # Hebrew calendar and date conversion
│   │   ├── prayer_schedule/         # Rules-based prayer time engine
│   │   ├── bulletin/                # Weekly Shabbat bulletin generator
│   │   └── llm/                     # Digital Gabbai chat interface
│   │
│   ├── api/v1/config.py             # GET/PATCH /api/v1/config (TenantConfig endpoint)
│   └── models/base.py               # Shared response envelope { success, message, data }
│
├── frontend/                        # React SPA (see frontend/README.md)
├── tests/                           # pytest integration tests
└── docs/
    ├── ARCHITECTURE.md              # Full system diagrams and design decisions
    ├── agent/                       # On-demand guides for AI agents (backend, frontend, ...)
    ├── ROADMAP_HE.md                # Full roadmap (Hebrew)
    ├── PRD_GABAY.md                 # Product requirements (English)
    └── PRD_GABAY_HE.md              # Product requirements (Hebrew)
```

---

## Configuration

All settings are documented in `.env.example`. Key variables:

| Variable | Where set | Description |
|---|---|---|
| `DATABASE_URL` | `.env` | SQLite (default) or PostgreSQL |
| `JWT_SECRET` | `.env` | Must be 32+ chars in production |
| `ENABLED_MODULES` | `.env` | Comma-separated list of active modules |
| `LLM_API_KEY` | `.env` | API key. A runtime override on `TenantConfig` is planned (v2.5 Settings) |
| `LLM_MODEL` | `.env` | e.g. `gpt-4o`, `gpt-4o-mini`. Same planned override as the API key |
| `ZMANIM_GEONAME_ID` | `.env` | City ID for prayer time calculations. Same planned override |

LLM and zmanim values are read from `.env` today. Changing them requires a restart. The admin Settings page that would override them at runtime is planned in v2.5.

---

## Milestones

| Version | Feature | Status |
|---|---|---|
| 1, 2, Infra, 1.5 | MVP, Calendar, Tests, Modular foundation | Done |
| 2.1 | Prayer schedule rules engine | Done |
| 2.2 | Weekly bulletin generator | Core done |
| 2.3 | Full financials + reports | Pending |
| 2.4 | Smart aliyah scheduler + inventory + LLM 2.0 | Pending |
| **2.5** | **Settings page** (profile, LLM, location, users, data export) | Pending |
| **3.0** | **Production** — security, Docker, PostgreSQL, cloud deploy | Pending |
| **3.1** | **Installation & onboarding** — first-run wizard, docs | Pending |
| **3.2** | **Support platform** — `/platform` panel, audit log, module catalog | Pending |
| 3.5 | WhatsApp community bot | Pending |
| 3.6 | Designed weekly bulletin (Canva-style) | Pending |
| 4.0 | SaaS multi-tenancy + license system | Pending |
| 5.0 | E2E tests + mobile app (React Native) | Future |

Full roadmap: [`ROADMAP.md`](ROADMAP.md) (English) · [`docs/ROADMAP_HE.md`](docs/ROADMAP_HE.md) (Hebrew)

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System diagrams, role model, design decisions
- [`docs/PRD_GABAY.md`](docs/PRD_GABAY.md) — Full product requirements (English)
- [`docs/PRD_GABAY_HE.md`](docs/PRD_GABAY_HE.md) — Full product requirements (Hebrew)
- [`AGENTS.md`](AGENTS.md) — AI agent rules; detailed guides in [`docs/agent/`](docs/agent/)
- [`ROADMAP.md`](ROADMAP.md) — Milestone-by-milestone development plan (English)
- [`docs/ROADMAP_HE.md`](docs/ROADMAP_HE.md) — Full roadmap (Hebrew)
