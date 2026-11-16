# Backlog

Ranked, highest priority first. Ideas, bugs and gaps go here instead of derailing the current slice. Version-level status lives in `ROADMAP.md`. Picking a row means build it; it is not moved into the roadmap. See `docs/product/WORKFLOW.md` for triage (small vs big, when a spec is needed).

**Types:** `idea` (new want), `gap` (missing piece of something that exists), `bug` (broken behaviour).
**Pain:** 1 = nice to have / cosmetic, 2 = slows the gabai down, 3 = blocks real use. For bugs, pain 3 means fix now on a `fix/<name>` branch.
**Effort:** S (under a day), M (1-3 days), L (more).
**Phase:** name it in the title when known (for example `v2.3`). An idea with no phase may need a roadmap decision before a spec.
**Status:** `open`, `next` (picked), `planned` (on the roadmap, not started), `done`.

| ID | Type | Title | Who needs it | Pain | Effort | Status |
|---|---|---|---|---|---|---|
| B-001 | idea | Pledge vs paid status on payments (v2.3 slice 1) | gabai | 3 | M | open |
| B-002 | idea | PDF donation receipts (v2.3) | gabai, donors | 2 | M | open |
| B-003 | idea | Expenses and annual report (v2.3) | gabai, admin | 2 | L | open |
| B-004 | idea | Reminder list for unpaid pledges | gabai | 2 | S | open |
| B-005 | gap | SMTP sending and SMTP settings UI for the weekly bulletin and yahrzeit reminders (v2.2 leftover, see `specs/weekly-bulletin.md`) | gabai, admin | 1 | M | open |
| B-006 | idea | Assistant side panel on every screen (v2.2.5 F4b, `specs/frontend-redesign.md`) | gabai, admin | 2 | M | planned |
| B-007 | idea | Saved assistant conversations: list, continue, rename, delete (v2.2.6) | gabai, admin | 2 | M | planned |
| B-008 | idea | Pin, share and export assistant conversations | gabai, admin | 1 | S | open |
| B-009 | idea | Page-aware assistant context ("ask about this congregant") | gabai | 2 | M | open |
| B-010 | idea | Retention policy: auto-delete conversations older than N days | admin | 1 | S | open |
| B-011 | idea | LLM-generated conversation titles | gabai, admin | 1 | S | open |
| B-012 | gap | Tenant accent: change the stored `TenantConfig` default from the old gold to bronze, and show the admin a warning when a chosen accent fails the contrast test (v2.5 settings page; see `specs/frontend-redesign.md` D-5, D-20, D-24) | admin | 1 | S | open |
| B-013 | gap | Frontend interaction tests with `jsdom` and Testing Library (new dev dependencies, ask first) | owner, developer | 1 | M | open |
| B-014 | idea | Self-hosted fonts through `@fontsource` instead of the Google Fonts link (v3.0 hardening; new dependency, ask first) | admin | 1 | S | open |
| B-015 | idea | Dark mode on the Warm Heritage tokens (no phase yet) | gabai, admin | 1 | M | open |
