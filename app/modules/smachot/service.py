"""Smachot (lifecycle celebrations) business-logic layer."""

from __future__ import annotations

from typing import Optional

from sqlmodel import select

from app.core.authorization import Actor, require_service_operational, scope_congregant_id
from app.core.db import get_session
from app.core.hebrew_date import (
    gregorian_to_hebrew,
    parse_gregorian_iso,
    upcoming_occurrences,
)
from app.modules.smachot.models import Simcha


class SimchaService:

    async def add_simcha(
        self,
        congregant_id: str,
        occasion_type: str,
        description: str = "",
        gregorian_date: str = "",
        hebrew_day: int = 0,
        hebrew_month: int = 0,
        parasha: str = "",
        year_occurred: Optional[int] = None,
        notes: str = "",
        *,
        actor: Actor,
    ) -> dict:
        require_service_operational(actor)
        day, month = hebrew_day, hebrew_month
        if gregorian_date and (not day or not month):
            d = parse_gregorian_iso(gregorian_date)
            if d:
                heb = gregorian_to_hebrew(d)
                day = heb["day"]
                month = heb["month"]

        if year_occurred is None and gregorian_date:
            try:
                year_occurred = int(gregorian_date[:4])
            except (ValueError, IndexError):
                pass

        simcha = Simcha(
            congregant_id=congregant_id,
            occasion_type=occasion_type,
            description=description,
            gregorian_date=gregorian_date,
            hebrew_day=day,
            hebrew_month=month,
            parasha=parasha,
            year_occurred=year_occurred,
            notes=notes,
        )
        with get_session() as session:
            session.add(simcha)
            session.commit()
            session.refresh(simcha)
            return simcha.model_dump()

    async def get_simcha(self, simcha_id: str, *, actor: Actor) -> dict | None:
        with get_session() as session:
            s = session.get(Simcha, simcha_id)
            if s:
                scope_congregant_id(actor, s.congregant_id)
            return s.model_dump() if s else None

    async def list_smachot(
        self,
        congregant_id: Optional[str] = None,
        occasion_type: Optional[str] = None,
        *,
        actor: Actor,
    ) -> dict:
        scoped_id = scope_congregant_id(actor, congregant_id)
        with get_session() as session:
            stmt = select(Simcha)
            if scoped_id:
                stmt = stmt.where(Simcha.congregant_id == scoped_id)
            if occasion_type:
                stmt = stmt.where(Simcha.occasion_type == occasion_type)
            smachot = session.exec(stmt).all()
            return {
                "total": len(smachot),
                "smachot": [s.model_dump() for s in smachot],
            }

    async def get_upcoming_smachot(
        self,
        days_ahead: int = 30,
        occasion_type: Optional[str] = None,
        *,
        actor: Actor,
    ) -> dict:
        require_service_operational(actor)
        from app.modules.congregants.models import Congregant
        with get_session() as session:
            stmt = select(Simcha)
            if occasion_type:
                stmt = stmt.where(Simcha.occasion_type == occasion_type)
            smachot = session.exec(stmt).all()
            congregant_map = {
                c.id: f"{c.first_name} {c.last_name}"
                for c in session.exec(select(Congregant)).all()
            }
        events = [s.model_dump() for s in smachot]
        upcoming = upcoming_occurrences(events, days_ahead=days_ahead)
        for item in upcoming:
            item["congregant_name"] = congregant_map.get(item.get("congregant_id"), "")
        return {
            "days_ahead": days_ahead,
            "occasion_type": occasion_type,
            "total": len(upcoming),
            "smachot": upcoming,
        }

    async def delete_simcha(self, simcha_id: str, *, actor: Actor) -> bool:
        require_service_operational(actor)
        with get_session() as session:
            s = session.get(Simcha, simcha_id)
            if not s:
                return False
            session.delete(s)
            session.commit()
            return True

    async def bulk_delete_smachot(self, ids: list[str], *, actor: Actor) -> dict:
        require_service_operational(actor)
        deleted = 0
        with get_session() as session:
            for sid in ids:
                s = session.get(Simcha, sid)
                if s:
                    session.delete(s)
                    deleted += 1
            session.commit()
        return {"deleted": deleted}


simcha_service = SimchaService()
