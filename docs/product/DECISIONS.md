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

### 2026-11-10 - The reviewer runs on a different model than the developer
Roles are assigned strength tiers (strongest, strong) and effort levels, not model versions; the table is in `OWNER_GUIDE.md`. In the files, `developer` and `pm` inherit the main chat model; `tester` and `reviewer` use the `sonnet` tier alias. If the main chat is on that same model, the coordinator passes another one to `reviewer`. Slices touching auth, permissions, money or schema always get the independent reviewer.
Alternatives: every role inherits the main model; pinned model versions in the frontmatter.
Reason: a model reviewing its own kind of output shares its blind spots, and pinned versions go stale as models change. One agent file serves Cursor and Claude Code: Claude Code accepts only `inherit`, `opus`, `sonnet`, `haiku`, and Cursor documents only `inherit` or exact model IDs, so cross-family review is chosen at call time in Cursor, not in the file.

### 2026-11-10 - Payments are voided or refunded, never deleted
A recorded payment keeps its history. Mistakes are voided (reason, actor, time); refunds and credits are linked records. Amount and date of a recorded payment are not edited. No hard-delete exception. Current `bulk_delete_payments` is a known gap, fixed in v2.3.
Alternatives: keep hard delete; hard delete only for recent entries.
Reason: donations are reconciled against bank statements and receipts, and books are handed between gabbaim; consistent with the archive-only rule for congregants.

### 2026-11-10 - Workflow tightening after external review
Added a trivial fast track, a migration-approval line, spec-before-branch and one-slice-per-commit rules, and a minimal PR CI roadmap item (v2.2.7). No separate `.cursorrules`: `AGENTS.md` already loads in every chat and a second file would drift.
Alternatives: new `RULES.md`; wait for full CI in v3.5.
Reason: solo owner relies on AI checks, so an automated gate is needed before money work.

### 2026-11-16 - The frontend redesign (v2.2.5) runs before pledge vs paid (v2.3)
The order in `ROADMAP.md` stands. B-001 goes back to `open` and `specs/pledge-paid.md` stays `draft` until the redesign is done.
Alternatives: pledge-paid backend slice first, then the redesign, then the pledge UI; all of pledge-paid first.
Reason: the financial screens are built once, on the new design system, and the owner works on one feature at a time.

### 2026-11-16 - The spec is the "what" and the only approval; a plan is the optional "how"
Every full-lane item has a spec, including the frontend redesign. A spec says what the user gets and when it is done, and the owner approves it. A plan (for example in `.cursor/plans/`) says how and in what order; it is optional and the spec links to it. If they disagree, the spec wins. Schema, auth and dependency approval happens only by approving the spec, so the v2.2.6 chat-history schema is not approved until its spec is.
Alternatives: plan-only phases with no spec; approval recorded in the roadmap or the plan.
Reason: one approval step in one file, so `developer` never guesses whether a plan counts.

### 2026-11-16 - One draft PR per feature, gabai pass per slice
The PR is opened as a draft right after slice 1 is pushed, and merged when the last slice is accepted. The owner's gabai pass happens per slice and gates the commit; the weekly review only catches up. Small-lane code changes use a `fix/<name>` or `chore/<name>` branch. A "big" backlog item (needs more than one spec, or changes what a phase promises) is added to a `ROADMAP.md` phase: `pm` recommends, the owner decides, the coordinator edits.
Alternatives: a PR per slice; a PR only when the feature is finished; gabai pass once a week.
Reason: CI runs only on pull requests and `main`, so an early draft PR is what makes it run on every slice. A weekly gabai pass would limit work to one slice a week.

### 2026-11-16 - The assistant side panel (F4b) is a slice of the frontend redesign spec
F4b sits between F4 and Gate 2 in `specs/frontend-redesign.md`; Gate 2 reviews the panel; Chat is migrated in F4b, not F7. Frontend only: same `llmApi.chat` call, no backend change. Owner accepted the PM recommendation (D-1), relayed by the coordinator.
Alternatives: a separate spec for the panel; build the panel after F9 and restyle `/chat` in F7.
Reason: the roadmap text (2026-11-03) is newer than the plan (2026-10-23), v2.2.6 depends on the panel, and Chat is migrated once.

### 2026-11-16 - The tenant accent is the stored `color_secondary`; the frontend ignores `color_primary` and `color_bg`
No backend, column or default change in v2.2.5. The document title and logo handling stay as they are. Owner accepted the PM recommendation (D-5), relayed by the coordinator. Together with the contrast fallback below, the old default gold may be replaced by bronze; the owner reconfirms this in D-24 of the spec.
Alternatives: treat the old default `#C5A059` as "not set" in the frontend; change the backend default.
Reason: no hidden special case and no exemption in the design enforcement script; the milestone stays frontend only.

### 2026-11-16 - A tenant accent that fails the contrast test falls back to the default bronze
The frontend computes the contrast in `applyTheme` (v2.2.5 F1). The exact pass test is open (spec D-24). Owner accepted the PM recommendation (D-20), relayed by the coordinator.
Alternatives: accept any color and leave it to the admin; use the tenant accent only for rules and borders.
Reason: tenants choose the color, so AA contrast cannot be promised without a check; there is no settings UI to warn the admin until v2.5.

### 2026-11-16 - Fonts load from the Google Fonts link; no `@fontsource` in v2.2.5
Display face: Frank Ruhl Libre, confirmed at Gate 1. Heebo stays the UI font. Owner accepted the PM recommendation (D-6), relayed by the coordinator.
Alternatives: self-hosted fonts through `@fontsource` packages (backlog B-014).
Reason: no new dependency in this milestone; offline and privacy needs are decided with v3.0 hardening and deploy.

### 2026-11-16 - Component tests in v2.2.5 use `react-dom/server` only
No `jsdom` and no Testing Library. Page flows are checked in the browser by the developer and in the gabai pass. Owner accepted the PM recommendation (D-7), relayed by the coordinator.
Alternatives: add `jsdom` and Testing Library for interaction tests (backlog B-013).
Reason: no new dependency in this milestone; the new primitives are simple enough to assert from static markup.


### 2026-11-16 - The accent contrast test is white text on the accent at 4.5:1
A tenant accent below 4.5:1 is replaced by the default bronze, with no message to the admin until the v2.5 settings page (B-012). The stored default gold `#C5A059` fails (about 2.5:1), so installs that never changed it show bronze after v2.2.5 F1. This completes the two accent entries above. Owner accepted the PM recommendation (D-24), relayed by the coordinator.
Alternatives: test at 3:1; keep the stored default gold and apply the fallback only to other values.
Reason: one simple test guarantees AA for small text on accent buttons, and it gives bronze on default installs without a backend change.

### 2026-11-16 - The v2.2.6 frontend slice starts after v2.2.5 is merged, not after Gate 2
The v2.2.6 backend slice may still run in parallel with v2.2.5 F1 to F4. `ROADMAP.md` still says "after v2.2.5 Gate 2" until the coordinator edits it. Owner accepted the PM recommendation (D-26), relayed by the coordinator.
Alternatives: branch v2.2.6 from the redesign branch after Gate 2 (stacked branch).
Reason: v2.2.5 lives on one branch until F9; the panel, tokens and `design:check` exist only there, and v2.2.6 edits the same assistant files that F8 cleans up. The owner works on one feature at a time.

### 2026-11-16 - `design:check` counts every raw Tailwind palette color, not only the gray family
Any palette color class with a numeric shade (`blue-600`, `red-500` and so on) is a violation; `white`, `black` and `transparent` are allowed. Added to the status script in v2.2.5 F0b, before the baseline is recorded. Owner accepted the PM recommendation (D-22), relayed by the coordinator.
Alternatives: also forbid `white` and `black`; keep the plan's gray-only rule and rely on review.
Reason: about 259 lines use raw status and brand colors today; without the rule the check could report 0 while pages bypass the semantic tokens.
