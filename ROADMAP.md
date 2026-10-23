# ROADMAP - Gabay

Live status in English. Agents read this file only. The full Hebrew roadmap with every historical checkbox is [`docs/ROADMAP_HE.md`](docs/ROADMAP_HE.md); it is for humans and is not loaded by agents.

When a milestone changes, update the status table and the affected section here, and mirror the change in `docs/ROADMAP_HE.md`.

Principle: day-to-day gabai functionality comes before deployment and polish. Auth is required before external sharing and before v3.5.

## Status

| Version | Theme | Status |
|---|---|---|
| 1 | MVP: congregants, payments, aliyot, seating, azkarot, smachot | Done |
| 2 | Core: Hebrew calendar, dashboard, LLM assistant | Done |
| Infra | Integration tests (pytest + httpx, in-memory SQLite) | Done |
| 1.5 | Modular foundation: registry, event bus, TenantConfig | Done |
| 2.1 | Prayer schedule and lessons | Done |
| 2.2 | Weekly bulletin | Core done; SMTP open |
| 2.2.5 | Frontend redesign (Warm Heritage), before 2.3 | Pending |
| 2.3 | Financial completeness | Pending |
| 2.4 | Smart gabai (aliya suggestions, inventory, LLM 2.0) | Pending |
| 2.5 | Settings page and roles expansion | Pending |
| 3.0 | Production: auth, hardening, deploy | Auth and scope done; hardening and deploy pending |
| 3.1 | Installation and onboarding | Pending |
| 3.2 | Support platform and module catalog | Pending |
| 3.5 | WhatsApp bot | Pending (needs 3.0) |
| 3.6 | Visual bulletin (Canva-style) | Pending |
| 4.0 | SaaS: multi-tenancy and licensing | Pending |
| 5.0 | E2E tests and mobile app | Future |

## Implemented vs planned (verify here before assuming)

Implemented: modules `congregants payments aliyot seating azkarot smachot calendar llm prayer_schedule auth bulletin`; roles `admin`, `gabai`, `congregant`; JWT access plus rotating refresh cookie; rate limiting; role-scoped LLM tools; Alembic baseline; frontend login and protected routes.

Planned, not in code yet: `super_admin` role, `/settings` page, `/platform` panel, audit log, `ModuleCatalog`, LLM and zmanim fields in `TenantConfig` (it currently holds branding and `enabled_modules` only), WhatsApp module, Docker, CI/CD.

`docs/ARCHITECTURE.md` describes the target state, not only the current state.

## Done milestones (one line each)

- v1: congregant CRUD with archive/restore/bulk-delete, CSV and Google Sheets import, pages for every domain.
- v2: Hebrew month calendar and date conversion, dashboard cards, LLM chat with tool-calling loop (up to 10 rounds) and tools per module, congregant detail panel tabs.
- Infra: integration tests per module, in-memory DB isolated from `gabay.db`.
- v1.5: `app/core/registry.py`, `app/core/hooks.py`, `TenantConfig`, `GET/PATCH /api/v1/config`, monolith split into `app/modules/*`, soft IDs between modules, dynamic sidebar and CSS variables from config.
- v2.1: `PrayerRule` and `SpecialDay` models, time calculation from anchors plus zmanim, schedule/week/generate endpoints, rule editor with drag and drop, Dashboard card, LLM tool `get_prayer_times`, tests.
- v3.0 steps 0, 1, 1.5, 2, 3: endpoint allowlist, `User` and `RefreshSession`, Argon2id, bootstrap-once register, login/refresh/logout, `require_roles`, service-level authorization, frontend `AuthContext` and token handling, server-side scope model, scoped LLM tools, rate limits with uniform 429.

## v2.2 - Weekly bulletin (open items)

- [ ] SMTP server configuration for automatic email reminders.
- [ ] SMTP settings UI.

Delivered: `BulletinConfig`, `GET /bulletin?date=`, three formats (WhatsApp text, email HTML, A4 print), per-week section toggles, wa.me share buttons.

## v2.2.5 - Frontend redesign (Warm Heritage)

Runs before v2.3 so new financial screens are built on the new system. Frontend only: no backend, schema or new npm dependency (ask first for `@fontsource` and `jsdom`/Testing Library). Detailed plan: `.cursor/plans/warm_heritage_frontend_final_8497efef.plan.md`.

Target state
- Warm stone background (`bg` #FAF8F5), white hairline-bordered surfaces, midnight blue `primary` (#172554), bronze `accent` (#B45309) plus AA-safe `accent-ink` for text. Heebo for UI, a Hebrew serif display face for titles only.
- Tokens in Tailwind v4 `@theme` (semantic: `bg`, `surface`, `line`, `ink`, `muted`, `primary`, `accent`, status colors). `--color-indigo` and `--color-gold` kept as temporary aliases, removed at the end.
- Tenants can change only the accent color and the logo; `applyTheme` ignores `color_primary` and `color_bg`.
- Existing `components/ui/` props stay valid; new `DataTable`, `Tabs`, `Toast`, `Skeleton`, `StatCard`, `Num`, `Ltr`.
- Light sidebar with a bronze active edge, Dashboard "today" strip, dense data tables with tabular numerals.
- RTL via logical utilities only; AA contrast; focus rings; 44px touch targets on phones; no horizontal scroll at 375, 768 and 1280px.

Subtasks (each ends with a self-check)
- [ ] F0a Docs and roadmap updated (this section, Hebrew mirror, frontend guide note).
- [ ] F0b Baseline and tooling: `npm run design:status` and `npm run design:check` (`frontend/scripts/design-status.mjs`); baseline hex 86, raw gray-family about 490, physical-direction about 26.
- [ ] F1 Tokens and fonts; contrast ratios computed and recorded.
- [ ] F2 Restyle existing primitives with unchanged APIs.
- [ ] Gate 1: design review of primitives (screenshots at three widths).
- [ ] F3 New primitives with server-render tests.
- [ ] F4 Shell and Login (sidebar, header, layout drawer).
- [ ] Gate 2: design review of shell, Login and Dashboard skeleton.
- [ ] F5 Pages A: Dashboard, Congregants.
- [ ] F6 Pages B: Payments, Aliyot, Azkarot, Smachot.
- [ ] F7 Pages C: Seating, Calendar, PrayerSchedule, Bulletin, Chat, Import.
- [ ] F8 Cleanup: remove aliases, `design:check` reports 0, accessibility and responsive pass.
- [ ] F9 Final docs: `docs/agent/frontend.md`, `modern-ui` skill and examples, `AGENTS.md` colors rule and definition of done.

Self-check after every subtask: `npm run lint`, `npm run build`, `npm test`; `npm run design:status` total never increases and migrated files report 0; Playwright MCP screenshots at 375, 768 and 1280px with no console errors and no horizontal scroll; two failed fixes of the same check means stop and report.

## v2.3 - Financial completeness

Backend
- [ ] Payment status: pledge vs paid.
- [ ] PDF receipts (synagogue logo, donation details).
- [ ] `Expense` model and CRUD `/synagogue/expenses`.
- [ ] `Income` model (non-donation income: hall rental, book sales, grants) and CRUD `/synagogue/income`.
- [ ] `GET /synagogue/reports/annual?year=` P&L report.
- [ ] CSV export: congregants and financial data.

Frontend
- [ ] Pledge/paid tab and "issue PDF receipt" button on Payments.
- [ ] Expenses tab, other-income tab, annual report tab (charts, PDF export).
- [ ] "Export CSV" button on Congregants.

## v2.4 - Smart gabai

- [ ] Aliya suggestion algorithm (frequency, proximity to yahrzeit or simcha, kohen/levi/israel); LLM tool `suggest_aliyot(parasha, date)`; dashboard widget and "suggest automatically" button on Aliyot.
- [ ] Inventory: `InventoryItem` model (name, quantity, category, notes), CRUD `/synagogue/inventory`, sidebar page.
- [ ] LLM 2.0: RAG over PDFs (bylaws, procedures, halacha), complex queries ("who did not get an aliya in six months"), halachic times inside chat answers.

## v2.5 - Settings

Principle: global settings (admin only) are separate from module-embedded settings (gabai accessible). Requires v3.0 auth (done).

Role tiers: `super_admin` (product team, `/platform`), `admin` (head gabbai, `/settings`, one per synagogue), `gabai` (operations, 1-3 per synagogue), `congregant` (WhatsApp only, v3.5).

Backend
- [ ] Add `super_admin` to `UserRole` in `app/modules/auth/models.py`.
- [ ] Extend `TenantConfig`: `llm_provider`, `llm_model`, `llm_api_key` (encrypted), `llm_base_url`, `zmanim_city_name`, `zmanim_geoname_id`, `setup_completed`; add migration for each new column.
- [ ] `GET /api/v1/config`: public returns branding only; admin returns everything with `llm_api_key` masked. `PATCH`: admin only, per-field validation.
- [ ] `GET /api/v1/config/test-llm` (admin): test the LLM connection.
- [ ] `app/core/llm.py` and `app/core/zmanim.py`: read `TenantConfig` first, `.env` fallback.
- [ ] `GET /api/v1/export/all` (admin): full JSON export.
- [ ] Tests `tests/test_settings.py`: admin full access, gabai gets 403 on PATCH, super_admin passes, empty `llm_api_key` falls back to `.env`.

Frontend
- [ ] `/settings` route, admin only, hidden from gabai.
- [ ] Tabs: synagogue profile (name, logo upload, colors); location and prayer times (city, Geoname ID, live candle-lighting preview); AI assistant (provider, model, masked API key, base URL, test button); users (list, invite, deactivate, change role); help and support (version, changelog, docs, export all data).
- [ ] Onboarding banner while `setup_completed` is false: profile, location, AI, invite gabai.

## v3.0 - Production (remaining steps)

Done: steps 0, 1, 1.5, 2 (frontend auth), 3 (scope and rate limits). Target cloud: AWS ECS Fargate + RDS PostgreSQL. Kubernetes is not required for v3.0; revisit in v4.0.

Step 4 - security hardening
- [ ] Security headers (HSTS under HTTPS, CSP, frame denial, nosniff, referrer policy).
- [ ] `CORS_ORIGINS` limited to the final domain, no wildcard with cookies.
- [ ] `DEBUG=False` in production, disable Swagger/ReDoc and detailed errors.
- [ ] Startup validation rejects weak or missing JWT secret in production.
- [ ] Structured logs with request ID, no tokens, cookies, passwords, LLM keys or personal data.
- [ ] Restrict Google Sheets import to approved HTTPS Google URLs with timeout and size limit.
- [ ] SCA, source, secret and container scans in CI.

Step 5 - Docker
- [ ] Multi-stage backend `Dockerfile` (non-root), `frontend/Dockerfile` (Vite build + nginx), `frontend/nginx.conf` (SPA fallback, `/api` proxy).
- [ ] `docker-compose.yml` (frontend, backend, PostgreSQL, health checks, volumes); `.dockerignore` excludes `.env`, local DBs, caches, `graphify-out`.
- [ ] Verify `docker compose up`: login, CRUD, refresh, logout, data persists after restart.

Step 6 - PostgreSQL
- [ ] Postgres driver; `check_same_thread` for SQLite only in `app/core/db.py`.
- [ ] `scripts/migrate_sqlite_to_postgres.py` (dry-run, empty target, transaction, preserve IDs); verify counts, foreign keys, sequences; rehearse on a copy of `gabay.db`; keep original SQLite read-only until backup and restore are proven.

Step 7 - cloud infrastructure
- [ ] ECR, ECS Fargate (frontend and backend), RDS PostgreSQL in private subnets, Secrets Manager, Route 53 + ACM + ALB, separate staging, `.env.production.example`, `docs/DEPLOYMENT.md`.

Step 8 - CI/CD
- [ ] GitHub Actions on PR: backend tests, frontend lint/build, migration validation, security scans.
- [ ] After merge or tag: build, scan, tag by commit SHA, push; auto-deploy to staging with one-off migration job and smoke tests; manual approval for production; staged deploy with automatic rollback; backward-compatible migrations; keep deployment history.

Step 9 - backup and operations
- [ ] `docs/BACKUP.md`, automated PostgreSQL backups with retention and off-site copy, documented restore drill.
- [ ] `/health/live` and `/health/ready` (DB only, no external LLM calls); error tracking, uptime monitor, alerts; runbook.

Definition of done for v3.0
- [ ] Without JWT every sensitive endpoint returns 401; unauthorized role gets 403; role matrix tests pass for admin, gabai, congregant.
- [ ] Only admin manages users/roles and changes `TenantConfig`, modules, integrations, security settings; gabai gets 403 on those.
- [ ] Logout revokes the refresh session; reuse of a refresh token revokes its family.
- [ ] Congregant scope enforced in service/DB even under prompt injection.
- [ ] CORS, rate limit, security headers and disabled docs tested automatically.
- [ ] Compose and staging pass smoke tests; migration, backup and restore proven on a real data copy; green pipeline with data-safe rollback.

## v3.1 - Installation and onboarding

Depends on v3.0.
- [ ] Docs: `docs/INSTALLATION.md`, `docs/UPGRADE.md`, `docs/BACKUP_RESTORE.md`, annotated `.env.example`, `CHANGELOG.md`.
- [ ] Bootstrap: `python -m app.cli bootstrap` (first admin), or a first-run page when no admin exists; first-run wizard (synagogue name, city, admin password, optional gabai invite); sets `TenantConfig.setup_completed = true`.
- [ ] Success: a non-developer installs from `git clone` to login in under 30 minutes; upgrade without downtime.

## v3.2 - Support platform

Depends on v3.0 and v3.1. Product team needs support tools without SSH.
- [ ] `ModuleCatalog` in code (not DB): `slug`, `display_name`, `description`, `tier` (`base`/`addon`/`enterprise`), `enabled_by_default`, `depends_on`. Base: `congregants payments aliyot seating azkarot smachot calendar auth prayer_schedule bulletin`. Addon: `llm whatsapp visual_bulletin`. Enterprise (v4.0+): `multi_tenant audit_log_extended sso`.
- [ ] `GET /platform/modules`, `GET /platform/modules/default-set`.
- [ ] `require_super_admin()`; `GET /platform/tenants`, `GET/PATCH /platform/tenants/{id}/config`, `GET /platform/tenants/{id}/audit-log`, `GET /platform/stats`; audit log model (actor, action, entity, old_value, new_value, timestamp).
- [ ] Frontend `/platform` (super_admin only): tenants table and detail, dashboard cards, module catalog page, in-app changelog.
- [ ] Admin notifications: LLM failure banner, 30-day export reminder, new-version notice. In-app "report a problem" and "request a feature" links (email or webhook, no DB).
- [ ] Success: remote config issues diagnosable without SSH; every `TenantConfig` change audit-logged.

## v3.5 - WhatsApp bot

Depends on v3.0 (JWT and LLM scope). Meta Cloud API for production, Twilio sandbox for development.
- [ ] `app/modules/whatsapp/` with `GET/POST /webhooks/whatsapp`; verify provider signature and sender number before matching `Congregant.phone`; unknown or ambiguous numbers get no private data and are escalated to a gabai.
- [ ] Congregant agent with restricted tools (`get_my_payments`, `get_my_aliyot`, `get_my_azkara_reminders`, `get_upcoming_events`, `get_parasha_info`); public reads and safe self-updates run immediately; sensitive changes create a gabai approval request; all queries filtered by `congregant_id` server-side; audit log for identity, tool, scope, change, approval and outcome.
- [ ] Outbound: template reminders for azkarot (D-7 and D-1), `POST /webhooks/broadcast`, "send WhatsApp reminder" button on Azkarot.

## v3.6 - Visual bulletin

Design layer over the v2.2 text bulletin.
- [ ] Layout engine: auto-scaling to one A4 page, content prioritization, live print preview.
- [ ] Theme manager, background and overlay uploads, rich text editor.
- [ ] Vector PDF export; JPG/PNG export for WhatsApp and Google Groups.

## v4.0 - SaaS platform

- [ ] Multi-tenancy: `tenant_id` on all models, middleware injecting it from JWT or subdomain, subdomain routing; document DB-per-tenant vs shared DB with row-level security.
- [ ] Licensing: `License` model (Basic/Premium/Enterprise, expiry, allowed modules), `LicenseService` validating against `ModuleCatalog` (`base` = Basic+, `addon` = Premium+, `enterprise` = Enterprise only), `POST /admin/licenses`.
- [ ] Admin panel: tenants page (super_admin), create/edit/disable synagogue, manage licenses and modules per tenant.

## v5.0 - QA and mobile

- [ ] Playwright E2E: smoke (login to dashboard), core flows (create congregant, record payment, annual report), responsive and basic accessibility checks.
- [ ] React Native + Expo app. Phase 1: dashboard, congregant search, record payment, push (Firebase). Phase 2: LLM chat, aliyot, azkarot, Hebrew calendar. Phase 3: full offline, biometrics, store release.
