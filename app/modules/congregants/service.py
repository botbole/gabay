"""Congregant business-logic layer."""

from __future__ import annotations

from datetime import date
from typing import Optional

from sqlmodel import select

from app.core.db import get_session
from app.core.hooks import hooks
from app.modules.congregants.models import Congregant


class CongregantService:

    async def add_congregant(
        self,
        first_name: str,
        last_name: str,
        hebrew_name: str = "",
        father_name: str = "",
        mother_name: str = "",
        phone: str = "",
        email: str = "",
        address: str = "",
        is_kohen: bool = False,
        is_levi: bool = False,
        member_type: str = "regular",
        notes: str = "",
        join_date: str = "",
    ) -> dict:
        congregant = Congregant(
            first_name=first_name,
            last_name=last_name,
            hebrew_name=hebrew_name,
            father_name=father_name,
            mother_name=mother_name,
            phone=phone,
            email=email,
            address=address,
            is_kohen=is_kohen,
            is_levi=is_levi,
            member_type=member_type,
            notes=notes,
            join_date=join_date or date.today().isoformat(),
        )
        with get_session() as session:
            session.add(congregant)
            session.commit()
            session.refresh(congregant)
            result = congregant.model_dump()
        await hooks.fire("congregant.created", congregant=result)
        return result

    async def get_congregant(self, congregant_id: str) -> dict | None:
        with get_session() as session:
            congregant = session.get(Congregant, congregant_id)
            return congregant.model_dump() if congregant else None

    async def find_congregant_by_name(self, name: str) -> dict | None:
        with get_session() as session:
            all_c = session.exec(select(Congregant)).all()
        name_lower = name.strip().lower()
        for c in all_c:
            if f"{c.first_name} {c.last_name}".lower() == name_lower:
                return c.model_dump()
        for c in all_c:
            if (name_lower in c.first_name.lower()
                    or name_lower in c.last_name.lower()
                    or name_lower in f"{c.first_name} {c.last_name}".lower()):
                return c.model_dump()
        return None

    async def update_congregant(self, congregant_id: str, updates: dict) -> dict | None:
        with get_session() as session:
            congregant = session.get(Congregant, congregant_id)
            if not congregant:
                return None
            for field, value in updates.items():
                setattr(congregant, field, value)
            session.add(congregant)
            session.commit()
            session.refresh(congregant)
            result = congregant.model_dump()
        await hooks.fire("congregant.updated", congregant=result)
        return result

    async def list_congregants(
        self,
        member_type: Optional[str] = None,
        archived: bool = False,
    ) -> dict:
        with get_session() as session:
            stmt = select(Congregant).where(Congregant.is_archived == archived)
            if member_type:
                stmt = stmt.where(Congregant.member_type == member_type)
            congregants = session.exec(stmt).all()
            return {
                "total": len(congregants),
                "congregants": [c.model_dump() for c in congregants],
            }

    async def bulk_delete_congregants(self, ids: list[str]) -> dict:
        deleted = 0
        with get_session() as session:
            for cid in ids:
                c = session.get(Congregant, cid)
                if c:
                    session.delete(c)
                    deleted += 1
            session.commit()
        return {"deleted": deleted}

    async def bulk_archive_congregants(self, ids: list[str]) -> dict:
        archived = 0
        today = date.today().isoformat()
        with get_session() as session:
            for cid in ids:
                c = session.get(Congregant, cid)
                if c and not c.is_archived:
                    c.is_archived = True
                    c.archived_at = today
                    session.add(c)
                    archived += 1
            session.commit()
        return {"archived": archived}

    async def bulk_restore_congregants(self, ids: list[str]) -> dict:
        restored = 0
        with get_session() as session:
            for cid in ids:
                c = session.get(Congregant, cid)
                if c and c.is_archived:
                    c.is_archived = False
                    c.archived_at = ""
                    session.add(c)
                    restored += 1
            session.commit()
        return {"restored": restored}


congregant_service = CongregantService()
