"""Aliyot business-logic layer."""

from __future__ import annotations

from datetime import date

from sqlmodel import select

from app.core.db import get_session
from app.core.hooks import hooks
from app.modules.aliyot.models import Aliya


class AliyotService:

    async def assign_aliya(
        self,
        congregant_id: str,
        parasha: str,
        aliya_type: str,
        date_str: str = "",
        minhag: str = "",
        donation_amount: float = 0.0,
        notes: str = "",
    ) -> dict:
        aliya = Aliya(
            congregant_id=congregant_id,
            parasha=parasha,
            aliya_type=aliya_type,
            date=date_str or date.today().isoformat(),
            minhag=minhag,
            donation_amount=donation_amount,
            notes=notes,
        )
        with get_session() as session:
            session.add(aliya)
            session.commit()
            session.refresh(aliya)
            result = aliya.model_dump()

        # Fire event so the payments module can auto-record the pledge
        if donation_amount > 0:
            await hooks.fire(
                "aliya.assigned_with_donation",
                congregant_id=congregant_id,
                amount=donation_amount,
                parasha=parasha,
                aliya_type=aliya_type,
                date_str=date_str or date.today().isoformat(),
            )

        await hooks.fire("aliya.assigned", aliya=result)
        return result

    async def list_aliyot(self) -> dict:
        with get_session() as session:
            aliyot = session.exec(select(Aliya).order_by(Aliya.date.desc())).all()
            return {
                "total": len(aliyot),
                "aliyot": [a.model_dump() for a in aliyot],
            }

    async def bulk_delete_aliyot(self, ids: list[str]) -> dict:
        deleted = 0
        with get_session() as session:
            for aid in ids:
                a = session.get(Aliya, aid)
                if a:
                    session.delete(a)
                    deleted += 1
            session.commit()
        return {"deleted": deleted}

    async def get_aliyot_for_parasha(self, parasha: str) -> dict:
        with get_session() as session:
            aliyot = session.exec(
                select(Aliya).where(Aliya.parasha == parasha)
            ).all()
            return {
                "parasha": parasha,
                "total": len(aliyot),
                "aliyot": [a.model_dump() for a in aliyot],
            }

    async def get_aliya_history(self, congregant_id: str) -> dict:
        with get_session() as session:
            aliyot = session.exec(
                select(Aliya).where(Aliya.congregant_id == congregant_id)
            ).all()
            return {
                "congregant_id": congregant_id,
                "total_aliyot": len(aliyot),
                "aliyot": [a.model_dump() for a in aliyot],
            }


aliyot_service = AliyotService()


# ---------------------------------------------------------------------------
# Hook: auto-record payment when aliya has a donation pledge
# ---------------------------------------------------------------------------

async def _on_aliya_donation(
    congregant_id: str,
    amount: float,
    parasha: str,
    aliya_type: str,
    date_str: str,
) -> None:
    from app.modules.payments.service import payment_service
    await payment_service.record_payment(
        congregant_id=congregant_id,
        amount=amount,
        purpose="aliya",
        payment_date=date_str,
        notes=f"Pledge at aliya: {parasha} – {aliya_type}",
    )


hooks.register("aliya.assigned_with_donation", _on_aliya_donation)
