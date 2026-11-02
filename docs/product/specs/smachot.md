# Smachot (simchot)

Status: done
Roadmap item: v1
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 1, Milestone 2, testing), `docs/PRD_Gabay.md` section 4.7.

## Problem
Community celebrations (bar mitzvahs, weddings, births) were remembered informally, so the gabai missed announcements and aliyot tied to them.

## User story
As a gabai, I want to record simchot and see the upcoming ones, so that I can announce them and honor the family.

## Acceptance criteria
- [x] Add a simcha: type (birthday, bar mitzvah, bat mitzvah, jubilee, brit milah, wedding, other), description, Hebrew and Gregorian date, parasha, year, notes.
- [x] Upcoming list for the next X days; the dashboard shows the next five within 30 days.
- [x] Filter by congregant and by type; simchot appear in the congregant detail panel and on the calendar.
- [x] Delete a simcha.
- [x] Integration tests cover the different types, filtering and delete.

## Out of scope
- Automatic greetings or WhatsApp messages (v3.5).

## Risks and open questions
- Hebrew date storage and display: see `docs/agent/domain-gotchas.md`.

## Slices
1. v1, shipped: model, CRUD, upcoming list, Smachot page.
