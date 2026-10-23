# Prayer schedule module

Files: `app/modules/prayer_schedule/` (`models.py`, `service.py`, `api.py`) and `frontend/src/pages/PrayerSchedule.tsx`. The most edge-case-heavy module.

Concept: a gabai defines "mincha = 15 minutes before sunset" instead of a fixed time; the system computes it from zmanim (Hebcal) per date.

## Rule semantics

- `candle_lighting` anchor always means the next Friday, not today or last Friday.
- `havdalah` anchor always means the next Saturday.
- `day_of_week`: 0 = Sunday ... 4 = Thursday, 5 = Friday (shown as "erev shabbat"), 6 = Saturday. `null` means every day.
- `no_auto_time`: when checked, hide the anchor subtitle row in the rule list and show no computed time.
- `is_lesson`: lessons display in green. Their `notes` field is the lesson time descriptor, not supplementary notes.

## Display rules

- Friday (`isFriday`): in the daily prayers block exclude Arvit and Mincha; show only Shabbat prayers whose computed time is at or after candle lighting.
- Live preview rows sort by `display_order` (the user's drag order), not by computed time.

## Known issues and fixes

- `update_rule` once used a `value is not None` guard that prevented clearing a field back to `None`. If a field refuses to clear, look for this pattern in `service.py`.
- The "error loading times" message in the live preview sidebar is an external Hebcal timeout, not a code bug. The sidebar has a retry button.
- Hebrew calendar logic goes through `app/core/hebrew_date.py`; see `docs/agent/domain-gotchas.md`.
