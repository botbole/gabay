"""Aliya La-Torah database model (soft reference to Congregant)."""

from __future__ import annotations

import uuid

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


class Aliya(SQLModel, table=True):
    __tablename__ = "aliyot"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(index=True)       # soft reference – no FK constraint
    parasha: str
    aliya_type: str
    date: str = ""
    minhag: str = ""
    donation_amount: float = 0.0
    notes: str = ""
