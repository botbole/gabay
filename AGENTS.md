# Gabay

Commercial synagogue management system. Backend: Python, FastAPI, SQLModel (SQLite default, PostgreSQL target). Frontend: React 19, TypeScript, Vite, Tailwind v4, TanStack Query. Includes a Hebrew LLM assistant that operates the system through OpenAI-style function calling.

## Commands

- Backend: `uvicorn main:app --reload` (port 8080, Swagger at `/docs`)
- Tests: `python -m pytest tests/<file>.py -q` (run the touched module's tests; add `-s` for Hebrew output)
- Frontend (in `frontend/`): `npm run dev`, `npm run lint`, `npm run build`, `npm test`

## Layout

- `app/core/`: registry, hooks (event bus), config, db, tenant, security, rate_limit, `hebrew_date.py`, zmanim, llm
- `app/modules/<slug>/`: `models.py`, `service.py`, `api.py`, `module.py`. Slugs: congregants, payments, aliyot, seating, azkarot, smachot, calendar, llm, prayer_schedule, auth, bulletin
- `app/api/v1/config.py`: tenant config endpoint. Shared envelope: `app/models/base.py`
- `frontend/src/`: `api/client.ts`, `pages/`, `components/ui/`, `components/layout/`, `contexts/`
- `tests/`, `migrations/` (Alembic), `docs/`

## Hard rules

Backend
- Flow is `api.py` -> `service.py` -> `models.py`. `api.py` never touches the DB.
- Modules never import each other. Use `hooks.fire` / `hooks.register`; cross-module references are plain string IDs, not foreign keys (exception: `User.congregant_id`).
- Every response uses `{ success, message, data }`.
- All Hebrew date logic goes through `app/core/hebrew_date.py` (pyluach wrapper). Never reimplement it.
- Never hard-delete congregants: use the `archived` flag. Bulk operations: `POST .../bulk-delete` with a list of IDs.
- Authorization is enforced in the router (`require_roles`) and again in the service. LLM tools are chosen by scope and re-authorized at dispatch. Congregant scope filters by `congregant_id` in the DB query. Frontend visibility is never a security boundary.
- Sensitive congregant self-service changes (identity, money, yahrzeit, seating, permissions) need gabai approval and an audit trail.
- Settings tiers: `.env` (install time) / `TenantConfig` (admin, runtime) / module-embedded config (gabai). Never mix them.

Frontend
- Only `frontend/src/api/client.ts` calls the backend. No direct `fetch`.
- TanStack Query for all server state. No Redux, Zustand, or Context for data fetching.
- Use `components/ui/` components (`PageHeader`, `EmptyState`, `Button`, `Input`, `Card`, `Modal`, `Badge`). Every page has `PageHeader`; every empty list has `EmptyState`.
- Use `import type` for interfaces and types.
- Colors via `var(--color-indigo)`, `var(--color-gold)`, `var(--color-bg)`. `dir="rtl"` is global; never override it.
- Every action shows loading and success/error feedback.

## Implemented vs planned

Roles in code: `admin`, `gabai`, `congregant`. `super_admin`, `/settings`, `/platform`, audit log, `ModuleCatalog`, LLM/zmanim fields in `TenantConfig`, the WhatsApp module, and the "Warm Heritage" frontend redesign (v2.2.5, new semantic tokens and `npm run design:check`) are planned, not implemented (see `ROADMAP.md`). `docs/ARCHITECTURE.md` describes the target state.

## New module checklist

1. `main.py`: import the module's `module.py`.
2. `app/core/config.py`: add the slug to `ENABLED_MODULES`.
3. `app/core/tenant.py`: add the slug to `ALL_MODULES`.
4. Existing DB row: add `_ensure_module_enabled("<slug>")` in `create_db_and_tables` (`app/core/db.py`). A restart alone does not update an existing `tenant_config` row.
5. Add `tests/test_<module>.py`.

## Definition of done

- Touched module's tests pass; new behavior has a test (pytest + httpx `AsyncClient`, fixtures in `tests/conftest.py`).
- Frontend changed: `npm run lint` and `npm run build` pass.
- Schema changed: follow `docs/agent/backend.md` (migrations).
- Update `ROADMAP.md` status lines only when a milestone item completes.

## Working agreements

- Ask before: schema changes, auth/authz changes, new dependencies.
- For multi-file features: plan, wait for confirmation, then implement. If two attempts at a fix fail, stop and report instead of looping.
- Explore narrowly: open the files named in the task. Use `graphify query "<question>"`, `graphify path "A" "B"` or `graphify explain "X"` only for cross-module or impact questions (event listeners, authz paths, who calls X). Skip graphify for single-file edits.
- Do not read `docs/*_HE.md`, `docs/ROADMAP_HE.md`, or `docs/PRD_*.md` unless asked. `ROADMAP.md` is the English roadmap.
- Instruction files, code and comments are English; Hebrew only for UI strings and product docs. No narrating comments.
- Stage explicit paths when committing; never commit `.env` or `gabay.db`. Commit only when asked.
- On "summarize for new chat": write a short handoff (goal, decisions, files touched, next step, open questions).
- If the user describes a visual bug, ask one question to confirm which element before coding.

## Read on demand

- Touching `app/**`, migrations, config, LLM, auth, tests: `docs/agent/backend.md`
- Touching `frontend/**` or UI design: `docs/agent/frontend.md`
- Prayer schedule (`app/modules/prayer_schedule/**`, `PrayerSchedule.tsx`): `docs/agent/prayer-schedule.md`
- Hebrew dates, seating numbers, azkarot/smachot display: `docs/agent/domain-gotchas.md`
- System design and diagrams: `docs/ARCHITECTURE.md`
