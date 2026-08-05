"""Azkarot (yahrzeit / memorial) business-logic layer."""

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
from app.modules.azkarot.models import Azkara


class AzkaraService:

    async def add_azkara(
        self,
        congregant_id: str,
        deceased_name: str,
        deceased_hebrew_name: str = "",
        relation: str = "",
        gregorian_date: str = "",
        hebrew_day: int = 0,
        hebrew_month: int = 0,
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

        azkara = Azkara(
            congregant_id=congregant_id,
            deceased_name=deceased_name,
            deceased_hebrew_name=deceased_hebrew_name,
            relation=relation,
            gregorian_date=gregorian_date,
            hebrew_day=day,
            hebrew_month=month,
            year_occurred=year_occurred,
            notes=notes,
        )
        with get_session() as session:
            session.add(azkara)
            session.commit()
            session.refresh(azkara)
            return azkara.model_dump()

    async def get_azkara(self, azkara_id: str, *, actor: Actor) -> dict | None:
        with get_session() as session:
            a = session.get(Azkara, azkara_id)
            if a:
                scope_congregant_id(actor, a.congregant_id)
            return a.model_dump() if a else None

    async def list_azkarot(
        self,
        congregant_id: Optional[str] = None,
        *,
        actor: Actor,
    ) -> dict:
        scoped_id = scope_congregant_id(actor, congregant_id)
        with get_session() as session:
            stmt = select(Azkara)
            if scoped_id:
                stmt = stmt.where(Azkara.congregant_id == scoped_id)
            azkarot = session.exec(stmt).all()
            return {
                "total": len(azkarot),
                "azkarot": [a.model_dump() for a in azkarot],
            }

    async def get_upcoming_azkarot(
        self,
        days_ahead: int = 30,
        *,
        actor: Actor,
    ) -> dict:
        require_service_operational(actor)
        from app.modules.congregants.models import Congregant
        with get_session() as session:
            azkarot = session.exec(select(Azkara)).all()
            congregant_map = {
                c.id: f"{c.first_name} {c.last_name}"
                for c in session.exec(select(Congregant)).all()
            }
        events = [a.model_dump() for a in azkarot]
        upcoming = upcoming_occurrences(events, days_ahead=days_ahead)
        for item in upcoming:
            item["congregant_name"] = congregant_map.get(item.get("congregant_id"), "")
        return {
            "days_ahead": days_ahead,
            "total": len(upcoming),
            "azkarot": upcoming,
        }

    async def delete_azkara(self, azkara_id: str, *, actor: Actor) -> bool:
        require_service_operational(actor)
        with get_session() as session:
            a = session.get(Azkara, azkara_id)
            if not a:
                return False
            session.delete(a)
            session.commit()
            return True

    async def bulk_delete_azkarot(self, ids: list[str], *, actor: Actor) -> dict:
        require_service_operational(actor)
        deleted = 0
        with get_session() as session:
            for aid in ids:
                a = session.get(Azkara, aid)
                if a:
                    session.delete(a)
                    deleted += 1
            session.commit()
        return {"deleted": deleted}


azkara_service = AzkaraService()
