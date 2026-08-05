"""Payment business-logic layer."""

from __future__ import annotations

from datetime import date
from typing import Optional

from sqlmodel import select

from app.core.authorization import Actor, require_service_operational, scope_congregant_id
from app.core.db import get_session
from app.core.hooks import hooks
from app.modules.payments.models import Payment


class PaymentService:

    async def record_payment(
        self,
        congregant_id: str,
        amount: float,
        purpose: str,
        currency: str = "ILS",
        notes: str = "",
        payment_date: str = "",
        *,
        actor: Actor,
    ) -> dict:
        require_service_operational(actor)
        payment = Payment(
            congregant_id=congregant_id,
            amount=amount,
            purpose=purpose,
            currency=currency,
            notes=notes,
            date=payment_date or date.today().isoformat(),
        )
        with get_session() as session:
            session.add(payment)
            session.commit()
            session.refresh(payment)
            result = payment.model_dump()
        await hooks.fire("payment.recorded", payment=result)
        return result

    async def get_payment_history(
        self,
        congregant_id: str,
        *,
        actor: Actor,
    ) -> dict:
        scoped_id = scope_congregant_id(actor, congregant_id)
        with get_session() as session:
            payments = session.exec(
                select(Payment).where(Payment.congregant_id == scoped_id)
            ).all()
            total_paid = sum(p.amount for p in payments)
            by_purpose: dict[str, float] = {}
            for p in payments:
                by_purpose[p.purpose] = by_purpose.get(p.purpose, 0.0) + p.amount
            return {
                "congregant_id": scoped_id,
                "total_paid": total_paid,
                "by_purpose": by_purpose,
                "payments": [p.model_dump() for p in payments],
            }

    async def get_pending_payments(self, *, actor: Actor) -> dict:
        require_service_operational(actor)
        from app.modules.congregants.models import Congregant
        with get_session() as session:
            congregants = session.exec(select(Congregant)).all()
            paid_ids = {
                p.congregant_id
                for p in session.exec(select(Payment)).all()
            }
            pending = [c for c in congregants if c.id not in paid_ids]
            return {
                "total_pending": len(pending),
                "congregants": [
                    {"id": c.id, "name": f"{c.first_name} {c.last_name}"}
                    for c in pending
                ],
            }

    async def get_all_payments(
        self,
        purpose: Optional[str] = None,
        *,
        actor: Actor,
    ) -> dict:
        require_service_operational(actor)
        with get_session() as session:
            stmt = select(Payment)
            if purpose:
                stmt = stmt.where(Payment.purpose == purpose)
            payments = session.exec(stmt).all()
            return {
                "total_records": len(payments),
                "total_amount": sum(p.amount for p in payments),
                "payments": [p.model_dump() for p in payments],
            }

    async def bulk_delete_payments(self, ids: list[str], *, actor: Actor) -> dict:
        require_service_operational(actor)
        deleted = 0
        with get_session() as session:
            for pid in ids:
                p = session.get(Payment, pid)
                if p:
                    session.delete(p)
                    deleted += 1
            session.commit()
        return {"deleted": deleted}


payment_service = PaymentService()
