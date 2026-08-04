"""Authentication database models."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    ADMIN = "admin"
    GABAI = "gabai"
    CONGREGANT = "congregant"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=_new_id, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=100)
    password_hash: str
    role: UserRole = Field(default=UserRole.CONGREGANT)
    is_active: bool = Field(default=True, index=True)
    bootstrap_marker: str | None = Field(default=None, unique=True, max_length=32)
    congregant_id: str | None = Field(
        default=None,
        foreign_key="congregants.id",
        index=True,
    )
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class RefreshSession(SQLModel, table=True):
    __tablename__ = "refresh_sessions"

    id: str = Field(default_factory=_new_id, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=64)
    family_id: str = Field(index=True)
    expires_at: datetime = Field(index=True)
    created_at: datetime = Field(default_factory=_utcnow)
    revoked_at: datetime | None = Field(default=None, index=True)
