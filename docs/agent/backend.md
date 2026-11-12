# Backend guide

## Module wiring

`main.py` imports every `app/modules/<slug>/module.py`. Each calls `registry.register(ModuleDefinition(...))`, then `main.py` mounts only slugs in `settings.ENABLED_MODULES`. Disabled modules expose no routes and no LLM tools.

A new module that is not wired in all places silently does not appear in the UI; `prayer_schedule` once missed `ALL_MODULES` and needed a manual DB fix.

### New module checklist

1. `main.py`: import the module's `module.py`.
2. `app/core/config.py`: add the slug to `ENABLED_MODULES`.
3. `app/core/tenant.py`: add the slug to `ALL_MODULES`.
4. Existing DB row: add `_ensure_module_enabled("<slug>")` in `create_db_and_tables` (`app/core/db.py`). A restart alone does not update an existing `tenant_config` row.
5. Add `tests/test_<module>.py`.

`app/core/db.py::_ensure_module_enabled(slug)` appends a slug to the existing `tenant_config.enabled_modules` row at startup. Use it for new modules; `ALL_MODULES` only initializes a missing row.

## Database schema changes

SQLModel `create_all` creates missing tables but never alters existing ones. Policy: **Alembic is the single path for schema changes.**

- New columns, tables and indexes: add an Alembic revision in `migrations/versions/` (`python -m alembic revision --autogenerate -m "<message>"`, then review it). Check with `python -m alembic upgrade head` on an empty SQLite file (`DATABASE_URL=sqlite:///<tmp>.db`) and `python -m alembic check`.
- `_MIGRATIONS` in `app/core/db.py` is frozen legacy for old SQLite dev databases. Do not append to it or edit existing entries; do not edit applied Alembic revisions.
- `create_all` still runs at startup for fresh dev databases and for tests.
- Ask before any schema change.

Revisions: `462a2db307be` (baseline), `a7f4c2d9e861` (gabai role), `488386355de3` (bulletin tables). The bulletin revision skips `create_table` when those tables already exist from `create_all`.

## Authorization and scope

Roles: `admin` (settings and users, plus full operations), `gabai` (full operations, no settings or users), `congregant` (WhatsApp only, verified phone to `Congregant` to server-enforced `congregant_id`; no `User` required).

- Routers: `require_roles("admin", "gabai")` and friends in `app/core/deps.py`.
- Services re-check protected operations because REST, LLM and WhatsApp reach the same service.
- LLM: tools are selected by `AuthScope` and re-authorized at dispatch. Congregant scope gets public tools plus `my_*` tools bound to its own `congregant_id`, even under prompt injection.
- Public endpoints only: `/health`, `GET /api/v1/config` (branding), login, refresh, logout, and bootstrap `register` while no users exist.
- Rate limits are separate for failed login, refresh and `/llm/chat`; response is 429 with `Retry-After`. Multi-instance production needs `RATE_LIMIT_BACKEND=redis`.

## Configuration tiers

- Tier 1, `.env` only: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `ENVIRONMENT`, `DEBUG`, rate limits, `ENABLED_MODULES`. Adding a module is a deployment procedure, not a UI toggle.
- Tier 2, `TenantConfig` row (admin via Settings, planned v2.5): branding today; LLM (`llm_provider`, `llm_model`, `llm_api_key`, `llm_base_url`) and location (`zmanim_city_name`, `zmanim_geoname_id`) planned. When added, read `TenantConfig` first and fall back to `.env`.
- Tier 3, module-embedded: prayer rules, bulletin config, aliya pricing, seating sections. Never move these to the global Settings page.

Rule of thumb: needed by a gabai day to day goes in module config; cross-cutting or billing/security relevant goes in Settings (admin only).

## LLM

- Provider settings come from `.env` today (`app/core/config.py`); the Hebrew system prompt is `LLM_SYSTEM_PROMPT` there.
- `LLM_BASE_URL` must be empty (not `""` passed to the client) for the standard OpenAI endpoint; an empty string breaks requests.
- `llm_client` is a module-level singleton: restart the server after changing `.env`.
- Tool definitions and dispatch live in `app/modules/llm/service.py`; each module may register `llm_tools` in `module.py`.

## Testing

- `python -m pytest tests/<file>.py -q`; add `-s` to see Hebrew labels.
- Fixtures: in-memory SQLite and `AsyncClient` in `tests/conftest.py`. Add a test file per new module.
- Windows console cannot print Hebrew by default. `tests/conftest.py` reconfigures stdout to UTF-8; for one-off scripts set `$env:PYTHONIOENCODING='utf-8'` in PowerShell.
- E2E (Playwright) is deferred to v5.0.

## Misc

- Upcoming azkarot: `Azkara` has no `congregant_name`. `get_upcoming_azkarot` joins `Congregant` in the service. Never resolve names on the frontend with per-item API calls.
- Import: CSV (Hebrew headers supported) and Google Sheets via `/synagogue/congregants/bulk/csv` and `/bulk/sheets`.
