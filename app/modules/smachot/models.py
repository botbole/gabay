"""Simcha (lifecycle celebration) database model (soft reference to Congregant)."""

from __future__ import annotations

import uuid
from typing import Literal, Optional

from sqlmodel import Field, SQLModel

SimchaType = Literal[
    "birthday",
    "anniversary",
    "bar_mitzvah",
    "bat_mitzvah",
    "brit",
    "upsherin",
    "other",
]


def _new_id() -> str:
    return str(uuid.uuid4())


class Simcha(SQLModel, table=True):
    __tablename__ = "smachot"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(index=True)       # soft reference – no FK constraint
    occasion_type: str
    description: str = ""
    hebrew_day: int = 0
    hebrew_month: int = 0
    gregorian_date: str = ""
    parasha: str = ""
    year_occurred: Optional[int] = Field(default=None, nullable=True)
    notes: str = ""
