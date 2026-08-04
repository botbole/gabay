"""Seating (sanctuary places) business-logic layer."""

from __future__ import annotations

from typing import Optional

from sqlmodel import select

from app.core.authorization import require_service_operational
from app.core.db import get_session
from app.modules.auth.models import User
from app.modules.seating.models import Place


class SeatingService:

    async def add_place(
        self,
        section: str,
        row: str,
        place_number: int,
        congregant_id: Optional[str] = None,
        is_reserved: bool = False,
        annual_fee: float = 0.0,
        notes: str = "",
        *,
        actor: User,
    ) -> dict:
        require_service_operational(actor)
        place = Place(
            section=section,
            row=row,
            place_number=place_number,
            congregant_id=congregant_id,
            is_reserved=is_reserved,
            annual_fee=annual_fee,
            notes=notes,
        )
        with get_session() as session:
            session.add(place)
            session.commit()
            session.refresh(place)
            return place.model_dump()

    async def assign_place(
        self,
        place_id: str,
        congregant_id: str,
        is_reserved: bool = True,
        annual_fee: float = 0.0,
        *,
        actor: User,
    ) -> dict | None:
        require_service_operational(actor)
        with get_session() as session:
            place = session.get(Place, place_id)
            if not place:
                return None
            place.congregant_id = congregant_id
            place.is_reserved = is_reserved
            if annual_fee:
                place.annual_fee = annual_fee
            session.add(place)
            session.commit()
            session.refresh(place)
            return place.model_dump()

    async def unassign_place(self, place_id: str, *, actor: User) -> dict | None:
        require_service_operational(actor)
        with get_session() as session:
            place = session.get(Place, place_id)
            if not place:
                return None
            place.congregant_id = None
            place.is_reserved = False
            session.add(place)
            session.commit()
            session.refresh(place)
            return place.model_dump()

    async def get_place(self, place_id: str) -> dict | None:
        with get_session() as session:
            place = session.get(Place, place_id)
            return place.model_dump() if place else None

    async def list_places(
        self,
        section: Optional[str] = None,
        only_free: bool = False,
    ) -> dict:
        with get_session() as session:
            stmt = select(Place)
            if section:
                stmt = stmt.where(Place.section == section)
            if only_free:
                stmt = stmt.where(Place.congregant_id == None)  # noqa: E711
            places = session.exec(stmt).all()
            return {
                "total": len(places),
                "places": [p.model_dump() for p in places],
            }

    async def get_congregant_place(self, congregant_id: str) -> dict | None:
        with get_session() as session:
            place = session.exec(
                select(Place).where(Place.congregant_id == congregant_id)
            ).first()
            return place.model_dump() if place else None

    async def bulk_delete_places(self, ids: list[str], *, actor: User) -> dict:
        require_service_operational(actor)
        deleted = 0
        with get_session() as session:
            for pid in ids:
                p = session.get(Place, pid)
                if p:
                    session.delete(p)
                    deleted += 1
            session.commit()
        return {"deleted": deleted}


seating_service = SeatingService()
