"""
Hebrew / Gregorian calendar conversion utilities.

Uses the `pyluach` library (pip install pyluach).

Month numbering follows the civil Hebrew calendar (Tishrei-first):
  7=Nisan  8=Iyar  9=Sivan  10=Tammuz  11=Av  12=Elul
  1=Tishrei  2=Cheshvan  3=Kislev  4=Tevet  5=Shvat
  6=Adar (or Adar I)  13=Adar II (leap years only)

pyluach uses its own internal numbering; we always work via HebrewDate
objects and never rely on raw month integers across library versions.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from pyluach import dates as _dates

# ---------------------------------------------------------------------------
# Month-name maps  (pyluach internal numbering: Nisan=1 … Elul=6, Tishrei=7 …)
# ---------------------------------------------------------------------------

HEBREW_MONTH_NAMES: dict[int, tuple[str, str]] = {
    1: ("ניסן", "Nisan"),
    2: ("אייר", "Iyar"),
    3: ("סיוון", "Sivan"),
    4: ("תמוז", "Tammuz"),
    5: ("אב", "Av"),
    6: ("אלול", "Elul"),
    7: ("תשרי", "Tishrei"),
    8: ("חשוון", "Cheshvan"),
    9: ("כסלו", "Kislev"),
    10: ("טבת", "Tevet"),
    11: ("שבט", "Shvat"),
    12: ("אדר", "Adar"),
    13: ("אדר ב׳", "Adar II"),
}


def _month_names(month: int) -> tuple[str, str]:
    return HEBREW_MONTH_NAMES.get(month, ("?", "Unknown"))


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def gregorian_to_hebrew(d: date) -> dict:
    """
    Convert a Python date to its Hebrew equivalents.

    Returns a dict with year, month (pyluach internal), day, formatted
    strings, and both Hebrew and transliterated month names.
    """
    hd = _dates.HebrewDate.from_pydate(d)
    heb_name, eng_name = _month_names(hd.month)
    return {
        "year": hd.year,
        "month": hd.month,
        "day": hd.day,
        "month_name_hebrew": heb_name,
        "month_name_english": eng_name,
        "formatted_hebrew": f"{hd.day} {heb_name} {hd.year}",
        "formatted_english": f"{hd.day} {eng_name} {hd.year}",
    }


def hebrew_to_gregorian(year: int, month: int, day: int) -> Optional[date]:
    """
    Convert a Hebrew date (pyluach month numbering) to a Gregorian Python date.
    Returns None if the date is invalid (e.g. 30 Cheshvan in a short year).
    """
    try:
        hd = _dates.HebrewDate(year, month, day)
        return hd.to_pydate()
    except Exception:
        return None


def get_next_occurrence(
    hebrew_month: int,
    hebrew_day: int,
    from_date: Optional[date] = None,
) -> Optional[date]:
    """
    Return the next Gregorian date on which hebrew_month/hebrew_day falls,
    searching from `from_date` (defaults to today) up to two Hebrew years ahead.

    Handles years where the day does not exist (e.g. 30 Cheshvan in a deficient
    year) by falling back one day.
    """
    if from_date is None:
        from_date = date.today()

    from_hd = _dates.HebrewDate.from_pydate(from_date)
    current_hebrew_year = from_hd.year

    for year_offset in range(3):
        year = current_hebrew_year + year_offset
        for fallback in (0, -1):
            day = hebrew_day + fallback
            if day < 1:
                continue
            gd = hebrew_to_gregorian(year, hebrew_month, day)
            if gd is not None and gd >= from_date:
                return gd

    return None


def upcoming_occurrences(
    events: list[dict],
    days_ahead: int = 30,
    from_date: Optional[date] = None,
) -> list[dict]:
    """
    Filter a list of event dicts to those whose Hebrew anniversary falls within
    the next `days_ahead` days.

    Each event dict **must** contain ``hebrew_month`` and ``hebrew_day`` keys.
    The returned list is sorted by next occurrence date and each item has an
    added ``next_gregorian`` key (ISO string).
    """
    if from_date is None:
        from_date = date.today()
    cutoff = from_date + timedelta(days=days_ahead)

    result: list[dict] = []
    for event in events:
        month = event.get("hebrew_month")
        day = event.get("hebrew_day")
        if not month or not day:
            continue
        next_date = get_next_occurrence(month, day, from_date)
        if next_date and next_date <= cutoff:
            result.append({**event, "next_gregorian": next_date.isoformat()})

    result.sort(key=lambda x: x["next_gregorian"])
    return result


def parse_gregorian_iso(date_str: str) -> Optional[date]:
    """Parse an ISO date string (YYYY-MM-DD) to a Python date, or return None."""
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


def hebrew_month_list() -> list[dict]:
    """Return all Hebrew months as a list for use in documentation or dropdowns."""
    return [
        {"month": m, "hebrew": h, "english": e}
        for m, (h, e) in sorted(HEBREW_MONTH_NAMES.items())
    ]
