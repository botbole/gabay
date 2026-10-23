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
