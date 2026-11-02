# Azkarot (yahrzeits)

Status: done
Roadmap item: v1
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 1, Milestone 2, testing), `docs/PRD_Gabay.md` section 4.6.

## Problem
Yahrzeits fall on Hebrew dates, so the Gregorian date moves every year. The gabai calculated them by hand and missed reminders.

## User story
As a gabai, I want to store yahrzeits for congregants' relatives and see the upcoming ones, so that I can notify families and arrange the memorial in time.

## Acceptance criteria
- [x] Add a yahrzeit: name of the deceased, relationship, Hebrew and Gregorian date, year of passing, notes.
- [x] Entering either a Gregorian or a Hebrew date works; Hebrew date logic goes through `app/core/hebrew_date.py`.
- [x] Upcoming list for the next X days; the dashboard shows the next five within 30 days.
- [x] Filter by congregant; yahrzeits appear in the congregant detail panel and on the calendar.
- [x] Delete a yahrzeit.
- [x] Integration tests cover Gregorian and Hebrew entry and delete.

## Out of scope
- Email reminders through SMTP (backlog).
- WhatsApp reminders at D-7 and D-1 (v3.5).
- Congregant self-service edits of yahrzeits (sensitive, needs gabai approval).

## Risks and open questions
- Hebrew date edge cases, including when the Hebrew day starts: see `docs/agent/domain-gotchas.md`.

## Slices
1. v1, shipped: model, CRUD, upcoming list, Azkarot page.
