"""Place (sanctuary seating) database model (soft reference to Congregant)."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


class Place(SQLModel, table=True):
    __tablename__ = "places"

    id: str = Field(default_factory=_new_id, primary_key=True)
    section: str
    row: str
    place_number: int
    congregant_id: Optional[str] = Field(default=None, index=True)  # soft reference
    is_reserved: bool = False
    annual_fee: float = 0.0
    notes: str = ""
