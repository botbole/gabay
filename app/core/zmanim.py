"""
Zmanim (halachic day times) and Shabbat candle-lighting / havdalah times.

Fetched from the free Hebcal REST API (https://www.hebcal.com/home/195/hebcal-rest-api),
configured for the Haifa horizon by default (see ``ZMANIM_GEONAME_ID`` in
``app.core.config``), matching the Israel Shabbat/Yom-Tov schedule used
throughout this app (see ``app.core.hebrew_date``).
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

import httpx

from app.core.config import settings

_HEBCAL_BASE = "https://www.hebcal.com"
_TIMEOUT = 10.0


def _hhmm(iso_dt: Optional[str]) -> Optional[str]:
    """Format an ISO datetime string (with UTC offset) as a local HH:MM string."""
    if not iso_dt:
        return None
    try:
        return datetime.fromisoformat(iso_dt).strftime("%H:%M")
    except ValueError:
        return None


async def get_day_zmanim(d: date) -> dict:
    """Fetch halachic day times (dawn, sunrise, sunset, etc.) for one date."""
    params = {"cfg": "json", "geonameid": settings.ZMANIM_GEONAME_ID, "date": d.isoformat()}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(f"{_HEBCAL_BASE}/zmanim", params=params)
        resp.raise_for_status()
        times = resp.json().get("times", {})

    return {
        "alot_hashachar": _hhmm(times.get("alotHaShachar")),
        "sunrise": _hhmm(times.get("sunrise")),
        "chatzot": _hhmm(times.get("chatzot")),
        "mincha_gedola": _hhmm(times.get("minchaGedola")),
        "plag_hamincha": _hhmm(times.get("plagHaMincha")),
        "sunset": _hhmm(times.get("sunset")),
        "tzeit_hakochavim": _hhmm(times.get("tzeit85deg")),
    }


async def get_shabbat_times(d: date) -> dict:
    """
    Fetch candle-lighting / havdalah times for the given date (Haifa horizon).

    Returns ``None`` values unless the date itself is the Friday (candle
    lighting) or Saturday (havdalah) of a Shabbat.
    """
    params = {
        "cfg": "json",
        "geonameid": settings.ZMANIM_GEONAME_ID,
        "gy": d.year,
        "gm": d.month,
        "gd": d.day,
        "M": "on",
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.get(f"{_HEBCAL_BASE}/shabbat", params=params)
        resp.raise_for_status()
        items = resp.json().get("items", [])

    iso = d.isoformat()
    candle_lighting = None
    havdalah = None
    parasha_he = None
    for item in items:
        item_date = (item.get("date") or "")[:10]
        if item_date != iso:
            continue
        category = item.get("category")
        if category == "candles":
            candle_lighting = _hhmm(item.get("date"))
        elif category == "havdalah":
            havdalah = _hhmm(item.get("date"))
        elif category == "parashat":
            parasha_he = (item.get("hebrew") or "").removeprefix("פרשת ") or None

    return {
        "candle_lighting": candle_lighting,
        "havdalah": havdalah,
        "parasha_he": parasha_he,
    }


async def get_day_times(d: date) -> dict:
    """Combine halachic zmanim with Shabbat candle-lighting / havdalah for one date."""
    zmanim = await get_day_zmanim(d)
    shabbat = await get_shabbat_times(d)
    return {
        "gregorian_date": d.isoformat(),
        "city": settings.ZMANIM_CITY_NAME,
        **zmanim,
        **shabbat,
    }
