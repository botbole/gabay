# Prayer schedule and lessons

Status: done
Roadmap item: v2.1
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (v2.1), `docs/PRD_Gabay.md` section 5.1.

## Problem
Prayer times depend on sunset and other zmanim, so fixed times go wrong every week. The gabai recalculated them by hand and retyped the weekly schedule.

## User story
As a gabai, I want to define each prayer or lesson as a rule such as "Mincha 15 minutes before sunset", so that the system calculates the real times every day and builds the weekly schedule for me.

## Acceptance criteria
- [x] A rule has a day type, an anchor (zman) with an offset, or a fixed time, or free text; it can be a lesson, limited to weekdays, and has a display order.
- [x] Day types: weekday, Shabbat, Yom Tov, Rosh Hashana, Yom Kippur, special day.
- [x] Special days are defined by Hebrew date.
- [x] Times for a date are calculated from the rules plus zmanim.
- [x] `GET /synagogue/schedule?date=`, `GET /synagogue/schedule/week?from_date=`, `GET /synagogue/schedule/generate` (copyable weekly text).
- [x] Rule editor: add, edit, delete, drag and drop to reorder, automatic sort by time.
- [x] Live preview by date with the calculated time next to each rule; lessons shown in green.
- [x] Tests cover CRUD, anchor calculation, holidays and the week view.

## Out of scope
- City and Geoname ID in `TenantConfig` (v2.5); the location comes from install-time config today.
- Printing the schedule on its own (the weekly bulletin covers it).

## Risks and open questions
- Details and gotchas: `docs/agent/prayer-schedule.md`.

## Slices
1. v2.1, shipped: `PrayerRule` and `SpecialDay` models, calculation, schedule endpoints.
2. v2.1, shipped: rule editor page with live preview and weekly text.
3. v2.1, shipped: dashboard card and LLM tool (recorded as slices in `dashboard.md` and `llm-assistant.md`).
