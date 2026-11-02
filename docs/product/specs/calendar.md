# Hebrew calendar

Status: done
Roadmap item: v2
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 2, testing), `docs/PRD_Gabay.md` section 4.2.

## Problem
The gabai converted between Hebrew and Gregorian dates by hand and had no single view of the month's Shabbatot, holidays, yahrzeits and simchot.

## User story
As a gabai, I want a month view with Hebrew and Gregorian dates and the community's events on it, so that I can plan the month at a glance.

## Acceptance criteria
- [x] Full month view showing Gregorian and Hebrew dates together.
- [x] Shabbat and Jewish holidays are highlighted.
- [x] Days with yahrzeits (amber) and simchot (pink) are marked; clicking a day opens a panel listing them.
- [x] Navigate to the previous month, the next month and today.
- [x] Date conversion API in both directions, and next occurrence of a Hebrew date.
- [x] All Hebrew date logic lives in `app/core/hebrew_date.py` (pyluach).
- [x] Tests cover conversions, next occurrence and the month view.

## Out of scope
- Prayer times on the calendar (prayer schedule feature).
- Zmanim location settings in `TenantConfig` (v2.5).

## Risks and open questions
- Hebrew date edge cases: see `docs/agent/domain-gotchas.md`.

## Slices
1. v2, shipped: conversion and month API, Calendar page with day panel.
