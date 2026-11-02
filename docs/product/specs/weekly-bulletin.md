# Weekly bulletin

Status: done (core; SMTP open in backlog)
Roadmap item: v2.2
Owner: eran

Retrospective spec, written after the core shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (v2.2), `docs/PRD_Gabay.md` section 5.2.

## Problem
Every week the gabai assembles the parasha, Shabbat times, yahrzeits and simchot into an announcement by hand, then retypes it for WhatsApp, email and the printed board.

## User story
As a gabai, I want the week's bulletin generated for me in WhatsApp, email and print formats, so that I can review it, toggle sections and send it in minutes.

## Acceptance criteria
- [x] `BulletinConfig` holds the synagogue name, rabbi, address and recurring announcements.
- [x] `GET /bulletin?date=` gathers the parasha, Shabbat times from the prayer schedule, and the week's yahrzeits and simchot.
- [x] Three formats: WhatsApp text, email HTML (Google Groups), A4 print page.
- [x] Sections can be included or removed per week.
- [x] Bulletin page with preview, editing, copy and print buttons.
- [x] "Send on WhatsApp" (wa.me) button next to each yahrzeit and simcha with a prepared message.

## Out of scope
- SMTP server configuration and automatic email reminders (backlog B-005).
- SMTP settings UI (backlog B-005).
- Designed Canva-style bulletin with themes and image export (v3.6).

## Risks and open questions
- Where SMTP settings belong (install-time `.env` or admin `TenantConfig`) is still open; the PRD defers it to the v2.5 scope.

## Slices
1. v2.2, shipped: `BulletinConfig`, bulletin service and endpoint, three formats.
2. v2.2, shipped: Bulletin page, section toggles, wa.me share buttons.
3. Open: SMTP sending and settings (backlog B-005).
