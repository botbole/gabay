# Decisions

Append-only. Newest at the bottom. Format: date, decision, alternatives, reason. Reversing a decision means adding a new entry, not editing the old one.

## Seed entries (taken from AGENTS.md and ROADMAP.md at setup time)

### 2026-10-23 - Modules never import each other
Cross-module links are plain string IDs and the `hooks` event bus. Exception: `User.congregant_id`.
Alternatives: foreign keys between module tables.
Reason: modules can be enabled per tenant, so they must stay independent.

### 2026-10-23 - Congregants are archived, never hard-deleted
Alternatives: hard delete.
Reason: payments, aliyot and azkarot history reference them; losing a record would corrupt financial and memorial history.

### 2026-10-23 - Settings are split into three tiers
`.env` (install time), `TenantConfig` (admin, runtime), module-embedded config (gabai). Never mixed.
Alternatives: one settings table for everything.
Reason: different owners, different risk, different change frequency.

### 2026-10-23 - Authorization is enforced in router and service
Frontend visibility is never a security boundary; LLM tools are re-authorized at dispatch.
Alternatives: router-only checks.
Reason: the LLM and future WhatsApp channels call services without going through the UI.

### 2026-10-23 - Day-to-day gabai features come before deployment and polish
Alternatives: deploy first, features later.
Reason: product value for the gabai drives adoption; auth (already done) is the only hard prerequisite for external sharing.

### 2026-10-23 - Multi-role agent workflow and PM docs adopted
Coordinator is the main chat agent guided by `AGENTS.md`; roles live in `.cursor/agents/`; specs, backlog and decisions live in `docs/product/`.
Reason: one person holds every role, so roles are separated by time and by file-based handoff.

## Retrospective entries (recorded 2026-10-30 from shipped work)

These choices were made while v1 to v3.0 were built and are recorded here after the fact. The version in each title is when the choice took effect.

### v1 - A payment row means money received
Alternatives: a status on every payment from the start.
Reason: the MVP only needed collected money and history. Pledges are the next change (`specs/pledge-paid.md`, v2.3), and every total that sums payments must be revisited then.

### v1 - Import lives inside the congregants feature
CSV and Google Sheets import map columns by header name, Hebrew or English, in any order.
Alternatives: a separate import feature with a fixed column order.
Reason: gabbaim arrive with their own spreadsheets; import exists to fill the congregant registry.

### Infra - Integration tests use pytest, httpx and an in-memory database
Alternatives: unit tests with mocks; tests against `gabay.db`.
Reason: tests exercise the real API and services without touching the live data file.

### v1.5 - Features are modules loaded from config
Registry plus `hooks` event bus; `TenantConfig` holds branding and `enabled_modules`; the sidebar and colors come from `GET /api/v1/config`.
Alternatives: keep growing the single synagogue router and service.
Reason: modules can be sold and enabled per synagogue, and new features stop growing a monolith. This is architecture, not a feature spec.

### v2.1 - Prayer times are rules over zmanim, not fixed times
A rule is an anchor plus an offset, a fixed time, or free text, per day type.
Alternatives: the gabai types the times every week.
Reason: times that follow sunset change weekly; rules are entered once and stay correct.

### v2.2 - Bulletin delivery is copy, print and wa.me
Alternatives: sending email through SMTP from the server.
Reason: the gabai can send the bulletin without any server mail setup. SMTP stays open in the backlog (B-005).

### v3.0 - Shipped roles are admin, gabai and congregant
`super_admin` waits for v2.5.
Alternatives: admin and congregant only (the original code); four roles at once.
Reason: day-to-day gabbaim must not manage users or settings, and the product-team role is not needed while there is one synagogue.

### v3.0 - Access token in memory, rotating refresh token in an HttpOnly cookie
Refresh tokens rotate with reuse detection; logout revokes the session.
Alternatives: tokens in localStorage; long-lived sessions.
Reason: limits damage from script injection and makes a stolen refresh token detectable.

### v3.0 - Public endpoints are an explicit allowlist
Only `/health`, `GET /api/v1/config`, login, refresh and the one-time bootstrap are public.
Alternatives: protect routes one by one.
Reason: a new router is protected by default; forgetting a check cannot expose data.

### v3.0 - Deploy target is AWS ECS Fargate with RDS PostgreSQL, not Kubernetes
Alternatives: Kubernetes now.
Reason: lower cost and operations for a single small instance. Revisit in v4.0 for multi-tenancy and high availability.

## Planned entries

### 2026-11-03 - The assistant is a side panel on every screen, not a separate page
Header toggle; pushes content on desktop, overlays on smaller screens; `/chat` stays as a full-page view of the same component (v2.2.5 F4b).
Alternatives: floating chat bubble; always-visible docked column; keep `/chat` only.
Reason: the gabai asks questions while working on another page; navigating away to chat breaks the task.

### 2026-11-03 - Assistant conversations are stored on the server, per user and private
Each user sees only their own conversations; admins cannot read other users' chats (404, not 403). Delete is a hard delete with cascade to messages (v2.2.6).
Alternatives: browser `localStorage`; admin read access for oversight; archive instead of delete.
Reason: chats follow the user across devices; shared synagogue computers make browser storage unsafe; chat text can contain personal data, so the user must be able to really delete it. The archive-only rule protects congregant records, not chat logs.

### 2026-11-03 - Conversation history sent to the LLM is loaded from the server
When `conversation_id` is present, client-sent `history` is ignored and only the last N stored messages are used.
Alternatives: trust the client history as today.
Reason: a client cannot inject fake assistant turns or tool results, and token use stays bounded.
