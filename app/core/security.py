"""JWT creation and validation primitives."""

from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt
from jwt import InvalidTokenError

from app.core.config import settings

TokenType = Literal["access", "refresh"]
ALGORITHM = "HS256"


class TokenValidationError(ValueError):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, user_id: str, role: str) -> tuple[str, datetime]:
    expires_at = _now() + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    return _encode_token(user_id=user_id, role=role, token_type="access", expires_at=expires_at), expires_at


def create_refresh_token(
    *,
    user_id: str,
    role: str,
    family_id: str | None = None,
) -> tuple[str, datetime, str]:
    expires_at = _now() + timedelta(days=settings.REFRESH_TOKEN_DAYS)
    family = family_id or str(uuid.uuid4())
    token = _encode_token(
        user_id=user_id,
        role=role,
        token_type="refresh",
        expires_at=expires_at,
        extra={"family": family},
    )
    return token, expires_at, family


def _encode_token(
    *,
    user_id: str,
    role: str,
    token_type: TokenType,
    expires_at: datetime,
    extra: dict[str, Any] | None = None,
) -> str:
    issued_at = _now()
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "type": token_type,
        "jti": str(uuid.uuid4()),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": issued_at,
        "exp": expires_at,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str, *, expected_type: TokenType) -> dict[str, Any]:
    required = ["sub", "role", "type", "jti", "iss", "aud", "iat", "exp"]
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
            options={"require": required},
        )
    except InvalidTokenError as exc:
        raise TokenValidationError("Invalid or expired token") from exc

    if payload.get("type") != expected_type:
        raise TokenValidationError("Incorrect token type")
    if not isinstance(payload.get("sub"), str) or not payload["sub"]:
        raise TokenValidationError("Invalid token subject")
    if payload.get("role") not in {"admin", "gabai", "congregant"}:
        raise TokenValidationError("Invalid token role")
    if expected_type == "refresh" and not isinstance(payload.get("family"), str):
        raise TokenValidationError("Refresh token family is missing")
    return payload


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
