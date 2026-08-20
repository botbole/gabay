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

**Four-tier role model:**
```
super_admin  → Gabay product team  → /platform panel (cross-installation support)
admin        → Synagogue admin     → /settings page (branding, LLM, users)
gabai        → Day-to-day staff    → all operational pages
congregant   → Worshipper          → WhatsApp self-service (v3.5)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full diagrams and design decisions.

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
│   ├── models/base.py               # Shared response envelope { success, message, data }
│   └── services/synagogue_service.py # Backward-compat facade
│
├── frontend/                        # React SPA (see frontend/README.md)
├── tests/                           # pytest integration tests
└── docs/
    ├── ARCHITECTURE.md              # Full system diagrams and design decisions
    ├── PRD_Gabay.md                 # Product requirements (English)
    ├── PRD_GABAY_HE.md              # Product requirements (Hebrew)
    └── PRD_GABAY.md                 # (alias)
```

---

## Configuration

All settings are documented in `.env.example`. Key variables:

| Variable | Where set | Description |
|---|---|---|
| `DATABASE_URL` | `.env` | SQLite (default) or PostgreSQL |
| `JWT_SECRET` | `.env` | Must be 32+ chars in production |
| `ENABLED_MODULES` | `.env` | Comma-separated list of active modules |
| `LLM_API_KEY` | `.env` → TenantConfig | API key (overridable via Settings page) |
| `LLM_MODEL` | `.env` → TenantConfig | e.g. `gpt-4o`, `gpt-4o-mini` |
| `ZMANIM_GEONAME_ID` | `.env` → TenantConfig | City ID for prayer time calculations |

LLM and zmanim settings can be overridden at runtime via the admin Settings page without restarting the server. All other variables require a restart.

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

Full roadmap: [`ROADMAP.md`](ROADMAP.md)

---

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System diagrams, role model, design decisions
- [`docs/PRD_Gabay.md`](docs/PRD_Gabay.md) — Full product requirements (English)
- [`docs/PRD_GABAY_HE.md`](docs/PRD_GABAY_HE.md) — Full product requirements (Hebrew)
- [`CLAUDE.md`](CLAUDE.md) — AI agent guidance and learned patterns
- [`ROADMAP.md`](ROADMAP.md) — Milestone-by-milestone development plan
