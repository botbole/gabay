# Congregants

Status: done
Roadmap item: v1 (detail panel added in v2)
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 1, Milestone 2 detail panel), `docs/PRD_Gabay.md` section 4.1.

## Problem
The gabai kept the community list in Excel sheets, notebooks or several parallel files. Records went stale, lookups during prayers were slow, and nothing linked a person to their payments, aliyot or yahrzeits.

## User story
As a gabai, I want one registry of congregants that I can search, edit, archive and import in bulk, so that every other feature can refer to the same person.

## Acceptance criteria
- [x] Create, read, update a congregant: name, Hebrew name, father's and mother's names, phone, email, address, gender, membership type (regular, guest, occasional), status (Kohen, Levi, Yisrael).
- [x] Search by name and filter by membership type.
- [x] Archive and restore one or many congregants; archived congregants are hidden from regular lists and their history is kept.
- [x] Bulk delete through `POST .../bulk-delete` with a list of IDs, with checkbox selection in the UI.
- [x] Import from CSV with Hebrew or English headers in any column order, including Kohen/Levi/Yisrael values.
- [x] Import from a Google Sheets URL.
- [x] Detail panel shows the profile, the assigned seat, and tabs for payments, aliyot, and yahrzeits and simchot.
- [x] Integration tests cover create, edit, archive, delete, filter and CSV import.

## Out of scope
- CSV export of congregants (v2.3).
- Congregant self-service and approval flow (v3.5).
- Hard delete of a congregant with history.

## Risks and open questions
- Google Sheets import accepts a URL; restricting it to approved Google HTTPS URLs with a timeout and size limit is a v3.0 hardening item.

## Slices
1. v1, shipped: model, CRUD, archive/restore, bulk delete, list page with search and filter.
2. v1, shipped: CSV and Google Sheets import page.
3. v2, shipped: congregant detail panel with related-record tabs.
