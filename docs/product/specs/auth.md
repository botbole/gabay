# Sign-in and roles

Status: done (v3.0 steps 0-3; hardening and deploy pending on the roadmap)
Roadmap item: v3.0
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (v3.0 steps 0, 1, 1.5, 2, 3), `docs/PRD_Gabay.md` section 2.

## Problem
Without sign-in, anyone who reaches the server can read and change congregant and financial data. The system cannot be shared outside the developer's machine, and the planned WhatsApp channel needs a safe scope model first.

## User story
As an admin, I want users to sign in with a role that limits what they can see and do, so that congregant and financial data are protected on every channel (UI, API, LLM).

## Acceptance criteria
- [x] Public endpoints are an explicit allowlist: `/health`, `GET /api/v1/config`, login, refresh and the one-time bootstrap.
- [x] Roles: `admin`, `gabai`, `congregant` (optional `User.congregant_id`).
- [x] Passwords hashed with Argon2id; the first admin is created once through bootstrap, after which only an admin creates users.
- [x] Login, refresh and logout; short-lived access JWT plus a rotating refresh token with reuse detection; logout revokes the session.
- [x] Every router is protected with `require_roles`, and sensitive actions are checked again in the service layer.
- [x] Only admin manages users and roles and changes `PATCH /api/v1/config`.
- [x] Anonymous requests get 401 and the wrong role gets 403 on every router.
- [x] Production startup rejects a weak JWT secret or an insecure cookie.
- [x] Frontend: Hebrew login page, protected routes, access token in memory, refresh token in an HttpOnly cookie, one refresh and retry on 401, logout clears the query cache, user and logout in the sidebar.
- [x] A congregant cannot read or change another congregant's data, including through the LLM.
- [x] Separate rate limits for failed login, refresh and `/llm/chat`; a uniform 429 that does not reveal whether a username exists.
- [x] Alembic baseline; `alembic upgrade head` succeeds on an empty SQLite database.

## Out of scope
- `super_admin` role and `/settings` page (v2.5).
- Security headers, CORS lock-down, structured logs, disabled docs in production (v3.0 step 4).
- Docker, PostgreSQL, cloud deploy, CI/CD, backups (v3.0 steps 5-9).
- Audit log (v3.2).

## Risks and open questions
- Hiding UI is never the security boundary; the backend stays the source of truth.

## Slices
1. v3.0 step 0, shipped: public allowlist, role model, baseline, cloud target chosen.
2. v3.0 step 1, shipped: `auth` module, `User`, `RefreshSession`, bootstrap, login/refresh/logout, Alembic baseline.
3. v3.0 step 1.5, shipped: every router protected, `require_roles`, service-level checks, 401/403 tests.
4. v3.0 step 2, shipped: frontend login, session handling, protected routes.
5. v3.0 step 3, shipped: server-side scope, scoped LLM tools, rate limits.
