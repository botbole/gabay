"""Calendar business-logic layer."""

from __future__ import annotations

from datetime import date

from sqlmodel import select

from app.core.db import get_session
from app.core.hebrew_date import (
    gregorian_to_hebrew,
    hebrew_to_gregorian,
    hebrew_month_list,
    get_next_occurrence,
    parse_gregorian_iso,
    get_month_view,
)
from app.core.zmanim import get_day_times


class CalendarService:

    async def convert_gregorian_to_hebrew(self, date_str: str) -> dict:
        d = parse_gregorian_iso(date_str)
        if not d:
            return {"error": f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD."}
        result = gregorian_to_hebrew(d)
        result["gregorian"] = date_str
        return result

    async def convert_hebrew_to_gregorian(self, year: int, month: int, day: int) -> dict:
        gd = hebrew_to_gregorian(year, month, day)
        if not gd:
            return {"error": f"Invalid or non-existent Hebrew date: {day}/{month}/{year}."}
        return {
            "hebrew_year": year,
            "hebrew_month": month,
            "hebrew_day": day,
            "gregorian": gd.isoformat(),
        }

    async def get_next_hebrew_occurrence(
        self,
        hebrew_month: int,
        hebrew_day: int,
        from_date_str: str = "",
    ) -> dict:
        from_date = parse_gregorian_iso(from_date_str) if from_date_str else date.today()
        next_date = get_next_occurrence(hebrew_month, hebrew_day, from_date)
        if not next_date:
            return {"error": "Could not determine next occurrence."}
        return {
            "hebrew_month": hebrew_month,
            "hebrew_day": hebrew_day,
            "next_gregorian": next_date.isoformat(),
        }

    async def list_hebrew_months(self) -> dict:
        return {"months": hebrew_month_list()}

    async def get_calendar_month_view(self, year: int, month: int) -> dict:
        from app.modules.azkarot.models import Azkara
        from app.modules.smachot.models import Simcha

        data = get_month_view(year, month)
        if "error" in data:
            return data

        with get_session() as session:
            azkarot = session.exec(select(Azkara)).all()
            smachot = session.exec(select(Simcha)).all()

        az_by_day: dict[tuple[int, int], list[dict]] = {}
        for a in azkarot:
            if a.hebrew_day and a.hebrew_month:
                key = (a.hebrew_day, a.hebrew_month)
                az_by_day.setdefault(key, []).append(a.model_dump())

        sm_by_day: dict[tuple[int, int], list[dict]] = {}
        for s in smachot:
            if s.hebrew_day and s.hebrew_month:
                key = (s.hebrew_day, s.hebrew_month)
                sm_by_day.setdefault(key, []).append(s.model_dump())

        for day in data["days"]:
            key = (day["hebrew_day"], day["hebrew_month"])
            day["azkarot"] = az_by_day.get(key, [])
            day["smachot"] = sm_by_day.get(key, [])

        return data

    async def get_calendar_day_times(self, date_str: str) -> dict | None:
        d = parse_gregorian_iso(date_str)
        if d is None:
            return None
        return await get_day_times(d)


calendar_service = CalendarService()
