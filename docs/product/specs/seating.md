# Seating

Status: done
Roadmap item: v1
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 1, testing), `docs/PRD_Gabay.md` section 4.5.

## Problem
Seat assignments and annual seat fees lived on a printed map or in a sheet. Answering "where does X sit" or "which seats are free" took a manual search.

## User story
As a gabai, I want a list of seats that I can assign and filter, so that I can answer seat questions quickly and fill free seats.

## Acceptance criteria
- [x] Define a seat: section, row, seat number, annual fee, assigned or not.
- [x] Assign and unassign a seat to a congregant.
- [x] Filter seats by available, occupied and section.
- [x] Find a congregant's seat; the seat is shown in the congregant detail panel.
- [x] Integration tests cover create, assign, unassign and filter.

## Out of scope
- Visual seat map editor.
- Congregant-requested seat changes (sensitive self-service, v3.5 with gabai approval).

## Risks and open questions
- Seat numbers run per row, not across the whole room: see `docs/agent/domain-gotchas.md`.

## Slices
1. v1, shipped: model, assign/unassign, filters, Seating page.
