"""Azkara (yahrzeit / memorial) database model (soft reference to Congregant)."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


class Azkara(SQLModel, table=True):
    __tablename__ = "azkarot"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(index=True)       # soft reference – no FK constraint
    deceased_name: str
    deceased_hebrew_name: str = ""
    relation: str = ""
    hebrew_day: int = 0
    hebrew_month: int = 0
    gregorian_date: str = ""
    year_occurred: Optional[int] = Field(default=None, nullable=True)
    notes: str = ""
