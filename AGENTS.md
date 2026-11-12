# Gabay

Commercial synagogue management system. Backend: Python, FastAPI, SQLModel (SQLite default, PostgreSQL target). Frontend: React 19, TypeScript, Vite, Tailwind v4, TanStack Query. Includes a Hebrew LLM assistant that operates the system through OpenAI-style function calling.

## Commands

- Backend: `uvicorn main:app --reload` (port 8080)
- Tests: `python -m pytest tests/<file>.py -q` (touched module only; `-s` for Hebrew output)
- Frontend (in `frontend/`): `npm run lint`, `npm run build`, `npm test`
- Shell is PowerShell on Windows. Hebrew in one-off scripts: `$env:PYTHONIOENCODING='utf-8'`.

## Layout

- `app/core/` (registry, hooks, config, db, tenant, security, `hebrew_date.py`, zmanim, llm); `app/modules/<slug>/` with `models.py`, `service.py`, `api.py`, `module.py`
- Slugs: congregants, payments, aliyot, seating, azkarot, smachot, calendar, llm, prayer_schedule, auth, bulletin
- `frontend/src/`: `api/client.ts`, `pages/`, `components/ui/`. Envelope: `app/models/base.py`. Full map: `docs/hierarchy/README.md`

## Hard rules

Backend
- Flow is `api.py` -> `service.py` -> `models.py`. `api.py` never touches the DB.
- Modules never import each other. Use `hooks.fire` / `hooks.register`; cross-module references are plain string IDs, not foreign keys (exception: `User.congregant_id`).
- Every response uses `{ success, message, data }`.
- All Hebrew date logic goes through `app/core/hebrew_date.py` (pyluach wrapper). Never reimplement it.
- Never hard-delete congregants: use the `archived` flag. Bulk operations: `POST .../bulk-delete` with a list of IDs.
- Authorization is enforced in the router (`require_roles`) and again in the service. LLM tools are chosen by scope and re-authorized at dispatch. Congregant scope filters by `congregant_id` in the DB query. Frontend visibility is never a security boundary.
- Never hard-delete payments (target; v2.3 replaces `bulk_delete_payments`): void with a reason or add a linked refund. See `docs/agent/domain-gotchas.md`.
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

Verify in `ROADMAP.md` ("Implemented vs planned"; grep it, do not read the whole file) before assuming a feature exists. Roles in code: `admin`, `gabai`, `congregant`. `docs/ARCHITECTURE.md` is the target state, not current.

## Definition of done

- Touched module's tests pass; new behavior has a test (pytest + httpx `AsyncClient`, fixtures in `tests/conftest.py`).
- Frontend changed: `npm run lint` and `npm run build` pass.
- Schema changed: follow `docs/agent/backend.md` (migrations).
- Update `ROADMAP.md` status lines only when a milestone item completes.

## Working agreements

- Ask before: schema changes, auth/authz changes, new dependencies.
- If two attempts at a fix fail, stop and report instead of looping.
- Explore narrowly: open the files named in the task. Use `graphify query|path|explain` only for cross-module or impact questions (event listeners, authz paths, who calls X). Skip it for single-file edits.
- Do not read `docs/*_HE.md`, `docs/ROADMAP_HE.md`, or `docs/PRD_*.md` unless asked.
- Instruction files, code and comments are English; Hebrew only for UI strings and product docs.
- Stage explicit paths when committing (`.env` and `gabay.db` are blocked by a hook). Commit only when asked.
- On "summarize for new chat": write a short handoff (goal, decisions, files touched, next step, open questions).
- If the user describes a visual bug, ask one question to confirm which element before coding.

## Workflow: pick the lane first

**Small lane (default): do it directly in the main chat, no subagents.** Use when ALL hold: one module or one page, roughly 3 files or fewer, no schema change, no auth/authz change, no new dependency, no new endpoint or LLM tool. Examples: bug fix, copy/UI tweak, validation rule, new field on an existing form. Then run the touched tests/lint, and stop.

**Full lane: multi-agent loop.** Use for a new feature, a new module, or anything that touches schema, auth/authz, money (payments) or the LLM tool surface, or when the user says "phase"/"slice"/`/run-phase`. If unsure which lane, say which one you picked and why in one line.

Full lane (procedure: `docs/product/WORKFLOW.md`; the main agent is the coordinator, agents in `.claude/agents/`):
1. `pm` writes `docs/product/specs/<feature>.md`. Stop and wait for the user to approve it.
2. `developer` builds one slice. `tester` and `reviewer` then run in parallel.
3. Fix loop runs at most twice, then report to the user.

- Subagents start with no context: pass the spec path, the slice, the acceptance criteria and the files in scope.
- Never run two developers on the same files in parallel.
- `reviewer` runs on a different model than `developer` (rules: `docs/product/OWNER_GUIDE.md`). Disagreements go to the user.
- Ideas found mid-build go to `docs/product/BACKLOG.md`; non-obvious choices to `docs/product/DECISIONS.md`; shipped slices to `CHANGELOG.md`.

## Read on demand

- Touching `app/**`, migrations, config, LLM, auth, tests, or adding a module (checklist): `docs/agent/backend.md`
- Touching `frontend/**` or UI design: `docs/agent/frontend.md`
- Prayer schedule (`app/modules/prayer_schedule/**`, `PrayerSchedule.tsx`): `docs/agent/prayer-schedule.md`
- Hebrew dates, seating numbers, azkarot/smachot display: `docs/agent/domain-gotchas.md`
- Repo map and what runs today: `docs/hierarchy/README.md`, `docs/hierarchy/ARCHITECTURE.md`
