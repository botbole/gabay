"""Service-layer authorization policies."""

from __future__ import annotations

from app.modules.auth.models import User, UserRole


class AuthorizationError(PermissionError):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def require_service_roles(actor: User | None, *roles: UserRole) -> None:
    if actor is None or not actor.is_active:
        raise AuthorizationError("Authentication required", 401)
    if actor.role not in roles:
        raise AuthorizationError("Insufficient permissions", 403)


def require_service_admin(actor: User | None) -> None:
    require_service_roles(actor, UserRole.ADMIN)


def require_service_operational(actor: User | None) -> None:
    require_service_roles(actor, UserRole.ADMIN, UserRole.GABAI)
