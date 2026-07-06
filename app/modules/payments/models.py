"""Payment / Donation database model.

congregant_id is stored as a plain string (no DB-level FK constraint)
to keep modules decoupled. Referential integrity is enforced at the
service layer.
"""

from __future__ import annotations

import uuid

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(index=True)       # soft reference – no FK constraint
    amount: float
    currency: str = "ILS"
    purpose: str
    date: str = ""
    notes: str = ""
