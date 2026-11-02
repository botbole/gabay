# Dashboard

Status: done
Roadmap item: v2 (prayer times card added in v2.1)
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 2, v2.1).

## Problem
Each piece of information lived on its own page. The gabai had no single screen showing what needs attention this week.

## User story
As a gabai, I want a home screen with the key numbers, the coming events and today's prayer times, so that I see what matters as soon as I open the system.

## Acceptance criteria
- [x] Cards: total congregants, total donations, pending payments, upcoming events.
- [x] The next five yahrzeits within 30 days: name of the deceased, relationship, date.
- [x] The next five simchot within 30 days: type and date.
- [x] "Today's times" card with the calculated prayer and lesson times.

## Out of scope
- Aliyah suggestions widget (v2.4).
- Onboarding banner (v2.5).
- "Today" strip from the frontend redesign (v2.2.5).

## Risks and open questions
- "Total donations" counts every payment as money received; the pledge spec changes that total.

## Slices
1. v2, shipped: stat cards, upcoming yahrzeits and simchot.
2. v2.1, shipped: today's prayer times card (rules live in `prayer-schedule.md`).
