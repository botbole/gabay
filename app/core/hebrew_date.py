"""
Hebrew / Gregorian calendar conversion utilities.

Uses the `pyluach` library (pip install pyluach).

Month numbering follows pyluach's own scheme:
  Nisan=1, Iyar=2, Sivan=3, Tammuz=4, Av=5, Elul=6,
  Tishrei=7, Cheshvan=8, Kislev=9, Tevet=10, Shvat=11,
  Adar=12, Adar II=13 (leap years only)

Civil calendar order (Tishrei-first):
  7 8 9 10 11 12 [13] 1 2 3 4 5 6
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from pyluach import dates as _dates
from pyluach import hebrewcal as _hebrewcal

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


# ---------------------------------------------------------------------------
# Hebrew numeral helpers
# ---------------------------------------------------------------------------

_GEMATRIA_SPECIAL: dict[int, str] = {15: "טו", 16: "טז"}
_GEMATRIA_TENS = [(30, "ל"), (20, "כ"), (10, "י")]
_GEMATRIA_ONES = [(9, "ט"), (8, "ח"), (7, "ז"), (6, "ו"), (5, "ה"),
                  (4, "ד"), (3, "ג"), (2, "ב"), (1, "א")]


def to_hebrew_numeral(n: int) -> str:
    """Convert an integer (1-30) to Hebrew gematria letters for day display."""
    if n in _GEMATRIA_SPECIAL:
        return _GEMATRIA_SPECIAL[n]
    result = ""
    remainder = n
    for val, letter in _GEMATRIA_TENS:
        if remainder >= val:
            result += letter
            remainder -= val
            break
    for val, letter in _GEMATRIA_ONES:
        if remainder >= val:
            result += letter
            break
    return result


def to_hebrew_year_str(year: int) -> str:
    """
    Convert a Hebrew year to its short gematria display string.
    e.g. 5786 → תשפ״ו
    """
    n = year % 1000  # Drop thousands digit for common short form
    hundreds = [(400, "ת"), (300, "ש"), (200, "ר"), (100, "ק")]
    tens = [(90, "צ"), (80, "פ"), (70, "ע"), (60, "ס"), (50, "נ"),
            (40, "מ"), (30, "ל"), (20, "כ"), (10, "י")]
    ones = [(9, "ט"), (8, "ח"), (7, "ז"), (6, "ו"), (5, "ה"),
            (4, "ד"), (3, "ג"), (2, "ב"), (1, "א")]

    result = ""
    for val, letter in hundreds:
        while n >= val:
            result += letter
            n -= val

    if n in _GEMATRIA_SPECIAL:
        result += _GEMATRIA_SPECIAL[n]
        n = 0
    else:
        for val, letter in tens:
            if n >= val:
                result += letter
                n -= val
                break
        for val, letter in ones:
            if n >= val:
                result += letter
                break

    # Add geresh / gerashayim
    if len(result) == 1:
        result += "׳"
    elif len(result) > 1:
        result = result[:-1] + "״" + result[-1]

    return result


# ---------------------------------------------------------------------------
# Holiday name mapping (pyluach English → Hebrew)
# ---------------------------------------------------------------------------

_HOLIDAY_HE: dict[str, str] = {
    "Rosh Hashana": "ראש השנה",
    "Yom Kippur": "יום כיפור",
    "Sukkos": "סוכות",
    "Chol Hamoed Sukkos": "חול המועד סוכות",
    "Hoshana Raba": "הושענא רבה",
    "Shmini Atzeres": "שמיני עצרת",
    "Simchas Torah": "שמחת תורה",
    "Chanukah": "חנוכה",
    "Tu Bishvat": 'ט"ו בשבט',
    "Purim Katan": "פורים קטן",
    "Purim": "פורים",
    "Shushan Purim": "שושן פורים",
    "Pesach": "פסח",
    "Chol Hamoed Pesach": "חול המועד פסח",
    "Pesach Sheni": "פסח שני",
    "Lag Baomer": 'ל"ג בעומר',
    "Shavuos": "שבועות",
    "Tu Beav": 'ט"ו באב',
    "Rosh Chodesh": "ראש חודש",
}


def _holiday_info(hd: "_dates.HebrewDate") -> tuple[str | None, str | None]:
    """Return (english_name, hebrew_name) for a date's holiday, or (None, None)."""
    try:
        eng = hd.holiday(israel=False)
    except Exception:
        eng = None
    if not eng:
        return None, None
    heb = _HOLIDAY_HE.get(eng, eng)
    return eng, heb


# ---------------------------------------------------------------------------
# Civil month order
# ---------------------------------------------------------------------------

def _civil_month_order(year: int) -> list[int]:
    """Return pyluach month numbers in civil order (Tishrei-first) for the year."""
    try:
        is_leap = _hebrewcal.Year(year).leap
    except Exception:
        is_leap = False
    order = [7, 8, 9, 10, 11, 12]
    if is_leap:
        order.append(13)
    order.extend([1, 2, 3, 4, 5, 6])
    return order


def _prev_next_months(year: int, month: int) -> tuple[tuple[int, int], tuple[int, int]]:
    """Return ((prev_year, prev_month), (next_year, next_month))."""
    order = _civil_month_order(year)
    if month not in order:
        order = [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6]

    try:
        idx = order.index(month)
    except ValueError:
        return (year, 7), (year, 7)

    if idx == 0:
        prev = (year - 1, 6)
    else:
        prev = (year, order[idx - 1])

    if idx == len(order) - 1:
        nxt = (year + 1, 7)
    else:
        nxt = (year, order[idx + 1])

    return prev, nxt


# ---------------------------------------------------------------------------
# Full month-view builder
# ---------------------------------------------------------------------------

def get_month_view(year: int, month: int) -> dict:
    """
    Build a full calendar data object for one Hebrew month.

    Returns a dict with year/month metadata and a ``days`` list.
    Each day includes Gregorian date, weekday, Shabbat flag, holiday names,
    and placeholder lists for azkarot/smachot events (populated by the service).
    """
    try:
        heb_year_obj = _hebrewcal.Year(year)
        is_leap: bool = heb_year_obj.leap
        # Find the requested month using itermonths()
        target_month = None
        for m in heb_year_obj.itermonths():
            if m.month == month:
                target_month = m
                break
        if target_month is None:
            return {"error": f"Month {month} does not exist in Hebrew year {year}"}
        hebrew_dates = list(target_month.iterdates())
    except Exception as exc:
        return {"error": str(exc)}

    heb_name, eng_name = _month_names(month)
    prev, nxt = _prev_next_months(year, month)

    days: list[dict] = []
    for hd in hebrew_dates:
        try:
            gd = hd.to_pydate()
            py_weekday = gd.weekday()        # 0=Mon … 5=Sat … 6=Sun (Python)
            grid_col = (py_weekday + 1) % 7  # 0=Sun, 1=Mon … 6=Sat
            is_shabbat = py_weekday == 5
            holiday_en, holiday_he = _holiday_info(hd)
            is_rosh_chodesh = (hd.day == 1) and not holiday_en

            days.append({
                "hebrew_day": hd.day,
                "hebrew_month": month,
                "hebrew_year": year,
                "hebrew_day_str": to_hebrew_numeral(hd.day),
                "gregorian_date": gd.isoformat(),
                "day_of_week": py_weekday,
                "grid_col": grid_col,
                "is_shabbat": is_shabbat,
                "holiday_en": holiday_en,
                "holiday_he": holiday_he if holiday_he else ("ראש חודש" if is_rosh_chodesh else None),
                "is_rosh_chodesh": is_rosh_chodesh,
                "azkarot": [],
                "smachot": [],
            })
        except Exception:
            continue

    return {
        "year": year,
        "month": month,
        "month_name_hebrew": heb_name,
        "month_name_english": eng_name,
        "is_leap_year": is_leap,
        "num_days": len(days),
        "hebrew_year_str": to_hebrew_year_str(year),
        "prev_month": {"year": prev[0], "month": prev[1]},
        "next_month": {"year": nxt[0], "month": nxt[1]},
        "days": days,
    }
