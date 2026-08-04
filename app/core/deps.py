"""Authentication and authorization dependencies."""

from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import TokenValidationError, decode_token
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import auth_service

bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User | None:
    if credentials is None:
        return None
    if credentials.scheme.lower() != "bearer":
        raise _unauthorized()
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
    except TokenValidationError as exc:
        raise _unauthorized() from exc

    user = auth_service.get_user(payload["sub"])
    if not user or not user.is_active or user.role.value != payload["role"]:
        raise _unauthorized()
    return user


def get_current_user(
    user: User | None = Depends(get_optional_current_user),
) -> User:
    if user is None:
        raise _unauthorized()
    return user


def require_roles(*roles: UserRole) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return dependency


require_admin = require_roles(UserRole.ADMIN)
require_operational = require_roles(UserRole.ADMIN, UserRole.GABAI)


def require_scoped_user(user: User = Depends(get_current_user)) -> User:
    if user.role == UserRole.CONGREGANT and not user.congregant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Congregant scope is not configured",
        )
    return user


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
