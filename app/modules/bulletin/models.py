"""Bulletin database models."""

from __future__ import annotations

import uuid

from sqlmodel import Field, SQLModel

DEFAULT_SECTIONS = "times,prayers,azkarot,smachot,announcements"


def _new_id() -> str:
    return str(uuid.uuid4())


class BulletinConfig(SQLModel, table=True):
    __tablename__ = "bulletin_config"

    id: int = Field(default=1, primary_key=True)
    rabbi: str = ""
    address: str = ""
    announcements: str = ""
    default_sections: str = DEFAULT_SECTIONS


class BulletinWeekOverride(SQLModel, table=True):
    __tablename__ = "bulletin_week_overrides"

    id: str = Field(default_factory=_new_id, primary_key=True)
    week_start: str = Field(index=True, unique=True)
    sections: str
