"""Authentication, password, and refresh-session business logic."""

from __future__ import annotations

from datetime import datetime, timezone

from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.core.db import get_session
from app.core.security import (
    TokenValidationError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_refresh_token,
)
from app.modules.auth.models import RefreshSession, User, UserRole

password_hash = PasswordHash.recommended()
_DUMMY_PASSWORD_HASH = password_hash.hash("not-a-real-password")


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _public_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role.value,
        "is_active": user.is_active,
        "congregant_id": user.congregant_id,
        "created_at": user.created_at,
    }


class AuthService:
    def hash_password(self, password: str) -> str:
        return password_hash.hash(password)

    def verify_password(self, password: str, encoded: str) -> bool:
        return password_hash.verify(password, encoded)

    def users_exist(self) -> bool:
        with get_session() as session:
            return session.exec(select(User.id).limit(1)).first() is not None

    def register(
        self,
        *,
        username: str,
        password: str,
        role: UserRole,
        congregant_id: str | None,
        actor: User | None,
    ) -> dict:
        normalized = username.strip().lower()
        with get_session() as session:
            first_user = session.exec(select(User.id).limit(1)).first() is None
            if first_user:
                role = UserRole.ADMIN
                congregant_id = None
            elif actor is None:
                raise AuthError("Authentication required", 401)
            elif actor.role != UserRole.ADMIN or not actor.is_active:
                raise AuthError("Administrator access required", 403)

            existing = session.exec(select(User).where(User.username == normalized)).first()
            if existing:
                raise AuthError("Username is already registered", 409)
            if role == UserRole.CONGREGANT and not congregant_id:
                raise AuthError("Congregant users must be linked to a congregant", 422)

            user = User(
                username=normalized,
                password_hash=self.hash_password(password),
                role=role,
                congregant_id=congregant_id,
                bootstrap_marker="initial-admin" if first_user else None,
            )
            session.add(user)
            try:
                session.commit()
            except IntegrityError as exc:
                session.rollback()
                raise AuthError("Username is already registered", 409) from exc
            session.refresh(user)
            return _public_user(user)

    def authenticate(self, username: str, password: str) -> dict:
        normalized = username.strip().lower()
        with get_session() as session:
            user = session.exec(select(User).where(User.username == normalized)).first()
            encoded = user.password_hash if user else _DUMMY_PASSWORD_HASH
            password_valid = self.verify_password(password, encoded)
            if not user or not password_valid or not user.is_active:
                raise AuthError("Invalid username or password")
            return self._issue_session(session, user)

    def refresh(self, token: str) -> dict:
        try:
            payload = decode_token(token, expected_type="refresh")
        except TokenValidationError as exc:
            raise AuthError("Invalid or expired refresh token") from exc

        token_hash = hash_refresh_token(token)
        with get_session() as session:
            refresh_session = session.exec(
                select(RefreshSession)
                .where(RefreshSession.token_hash == token_hash)
                .with_for_update()
            ).first()
            if not refresh_session:
                raise AuthError("Invalid or expired refresh token")

            if refresh_session.revoked_at is not None:
                self._revoke_family(session, refresh_session.family_id)
                raise AuthError("Refresh token reuse detected")
            if _as_utc(refresh_session.expires_at) <= _now():
                refresh_session.revoked_at = _now()
                session.add(refresh_session)
                session.commit()
                raise AuthError("Invalid or expired refresh token")
            if payload["sub"] != refresh_session.user_id or payload["family"] != refresh_session.family_id:
                self._revoke_family(session, refresh_session.family_id)
                raise AuthError("Invalid refresh token")

            user = session.get(User, refresh_session.user_id)
            if not user or not user.is_active:
                self._revoke_family(session, refresh_session.family_id)
                raise AuthError("User account is disabled", 403)

            refresh_session.revoked_at = _now()
            session.add(refresh_session)
            session.commit()
            return self._issue_session(session, user, family_id=refresh_session.family_id)

    def logout(self, token: str) -> None:
        token_hash = hash_refresh_token(token)
        with get_session() as session:
            refresh_session = session.exec(
                select(RefreshSession).where(RefreshSession.token_hash == token_hash)
            ).first()
            if refresh_session:
                self._revoke_family(session, refresh_session.family_id)

    def get_user(self, user_id: str) -> User | None:
        with get_session() as session:
            return session.get(User, user_id)

    def _issue_session(self, session, user: User, family_id: str | None = None) -> dict:
        access_token, access_expires_at = create_access_token(
            user_id=user.id,
            role=user.role.value,
        )
        refresh_token, refresh_expires_at, family = create_refresh_token(
            user_id=user.id,
            role=user.role.value,
            family_id=family_id,
        )
        session.add(
            RefreshSession(
                user_id=user.id,
                token_hash=hash_refresh_token(refresh_token),
                family_id=family,
                expires_at=refresh_expires_at,
            )
        )
        session.commit()
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": max(0, int((access_expires_at - _now()).total_seconds())),
            "user": _public_user(user),
        }

    def _revoke_family(self, session, family_id: str) -> None:
        sessions = session.exec(
            select(RefreshSession).where(RefreshSession.family_id == family_id)
        ).all()
        revoked_at = _now()
        for refresh_session in sessions:
            if refresh_session.revoked_at is None:
                refresh_session.revoked_at = revoked_at
                session.add(refresh_session)
        session.commit()


auth_service = AuthService()
