# Domain gotchas

## Hebrew dates (pyluach)

- All conversion logic lives in `app/core/hebrew_date.py`. Never add conversion elsewhere.
- Yahrzeit and simcha records store both a Gregorian and a Hebrew date.
- 1 Tishrei 5786 is September 23, 2025 (not the 22nd). The Hebrew day starts at nightfall, but pyluach's `HebrewDate` refers to the calendar day.
- `Month` has no `monthlen()` or `month_lengths`. Iterate with `month.iterdates()`.
- `Year.itermonths()` starts at Tishrei (month 7), not Nisan (month 1).

## Seating

Seat numbers are per row (1 to row width), not global. `SeatTile` shows `place.place_number` only, never `row + place_number`, because the row letter is already in the row header.

## Azkarot and smachot

- `Azkara` does not store `congregant_name`; the service joins `Congregant` (see `docs/agent/backend.md`).
- Both have `hebrew_day`, `hebrew_month`, `gregorian_date`, and `year_occurred`.
