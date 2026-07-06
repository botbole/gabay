"""Congregant (Mispallel) database model."""

from __future__ import annotations

import uuid
from typing import Literal

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


MemberType = Literal["regular", "guest", "occasional"]


class Congregant(SQLModel, table=True):
    __tablename__ = "congregants"

    id: str = Field(default_factory=_new_id, primary_key=True)
    first_name: str
    last_name: str
    hebrew_name: str = ""
    father_name: str = ""
    mother_name: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    is_kohen: bool = False
    is_levi: bool = False
    member_type: str = "regular"
    notes: str = ""
    join_date: str = ""
    gender: str = "male"
    is_archived: bool = False
    archived_at: str = ""
