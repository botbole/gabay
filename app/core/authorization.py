"""Service-layer authorization policies."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TypeAlias

from app.modules.auth.models import User, UserRole


class AuthorizationError(PermissionError):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass(frozen=True, slots=True)
class AuthScope:
    actor_id: str
    role: UserRole
    congregant_id: str | None = None
    channel: str = "web"

    @classmethod
    def from_user(cls, user: User) -> "AuthScope":
        return cls(
            actor_id=user.id,
            role=user.role,
            congregant_id=user.congregant_id,
            channel="web",
        )

    @classmethod
    def for_congregant(
        cls,
        congregant_id: str,
        *,
        actor_id: str | None = None,
        channel: str = "whatsapp",
    ) -> "AuthScope":
        return cls(
            actor_id=actor_id or congregant_id,
            role=UserRole.CONGREGANT,
            congregant_id=congregant_id,
            channel=channel,
        )


Actor: TypeAlias = User | AuthScope


def get_auth_scope(actor: Actor | None) -> AuthScope:
    if actor is None or (isinstance(actor, User) and not actor.is_active):
        raise AuthorizationError("Authentication required", 401)
    scope = actor if isinstance(actor, AuthScope) else AuthScope.from_user(actor)
    if scope.role == UserRole.CONGREGANT and not scope.congregant_id:
        raise AuthorizationError("Congregant scope is not configured", 403)
    return scope


def require_service_roles(actor: Actor | None, *roles: UserRole) -> AuthScope:
    scope = get_auth_scope(actor)
    if scope.role not in roles:
        raise AuthorizationError("Insufficient permissions", 403)
    return scope


def require_service_admin(actor: Actor | None) -> AuthScope:
    return require_service_roles(actor, UserRole.ADMIN)


def require_service_operational(actor: Actor | None) -> AuthScope:
    return require_service_roles(actor, UserRole.ADMIN, UserRole.GABAI)


def scope_congregant_id(
    actor: Actor | None,
    requested_congregant_id: str | None = None,
) -> str | None:
    scope = get_auth_scope(actor)
    if scope.role == UserRole.CONGREGANT:
        if requested_congregant_id and requested_congregant_id != scope.congregant_id:
            raise AuthorizationError("Insufficient permissions", 403)
        return scope.congregant_id
    if scope.role not in (UserRole.ADMIN, UserRole.GABAI):
        raise AuthorizationError("Insufficient permissions", 403)
    return requested_congregant_id
