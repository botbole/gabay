"""Authentication routes."""

from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.deps import get_optional_current_user
from app.core.rate_limit import client_ip, get_rate_limit_backend, rate_limit_key
from app.models.base import APIResponse
from app.modules.auth.models import User, UserRole
from app.modules.auth.service import AuthError, auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=12, max_length=1024)
    role: UserRole = UserRole.CONGREGANT
    congregant_id: str | None = None


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=1024)


@router.post("/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
def register(
    req: RegisterRequest,
    actor: User | None = Depends(get_optional_current_user),
):
    try:
        user = auth_service.register(
            username=req.username,
            password=req.password,
            role=req.role,
            congregant_id=req.congregant_id,
            actor=actor,
        )
        return APIResponse(message="User created successfully.", data=user)
    except AuthError as exc:
        return _auth_error(exc)


@router.post("/login", response_model=APIResponse)
async def login(req: LoginRequest, request: Request, response: Response):
    backend = get_rate_limit_backend()
    key = rate_limit_key("login-failed", client_ip(request), req.username)
    try:
        current = await backend.get(
            key,
            limit=settings.LOGIN_FAILED_RATE_LIMIT,
            window=settings.LOGIN_FAILED_RATE_WINDOW_SECONDS,
        )
    except Exception:
        return _limiter_unavailable()
    if not current.allowed:
        return _rate_limited(current.retry_after)

    try:
        tokens = auth_service.authenticate(req.username, req.password)
        try:
            await backend.reset(key)
        except Exception:
            return _limiter_unavailable()
        _set_refresh_cookie(response, tokens.pop("refresh_token"))
        return APIResponse(message="Login successful.", data=tokens)
    except AuthError as exc:
        try:
            decision = await backend.hit(
                key,
                limit=settings.LOGIN_FAILED_RATE_LIMIT,
                window=settings.LOGIN_FAILED_RATE_WINDOW_SECONDS,
            )
        except Exception:
            return _limiter_unavailable()
        if not decision.allowed:
            return _rate_limited(decision.retry_after)
        return _auth_error(exc)


@router.post("/refresh", response_model=APIResponse)
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    try:
        decision = await get_rate_limit_backend().hit(
            rate_limit_key("refresh", client_ip(request), refresh_token or "missing"),
            limit=settings.REFRESH_RATE_LIMIT,
            window=settings.REFRESH_RATE_WINDOW_SECONDS,
        )
    except Exception:
        return _limiter_unavailable()
    if not decision.allowed:
        return _rate_limited(decision.retry_after)

    if not refresh_token:
        return _auth_error(AuthError("Refresh token is required"))
    try:
        tokens = auth_service.refresh(refresh_token)
        _set_refresh_cookie(response, tokens.pop("refresh_token"))
        return APIResponse(message="Session refreshed.", data=tokens)
    except AuthError as exc:
        error_response = _auth_error(exc)
        error_response.delete_cookie(
            settings.REFRESH_COOKIE_NAME,
            path=settings.REFRESH_COOKIE_PATH,
        )
        return error_response


@router.post("/logout", response_model=APIResponse)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=settings.REFRESH_COOKIE_NAME),
):
    if refresh_token:
        auth_service.logout(refresh_token)
    response.delete_cookie(
        settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
    )
    return APIResponse(message="Logged out successfully.")


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
    )


def _auth_error(exc: AuthError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.message, "data": None},
    )


def _rate_limited(retry_after: int) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        headers={"Retry-After": str(max(1, retry_after))},
        content={
            "success": False,
            "message": "Too many requests. Please try again later.",
            "data": None,
        },
    )


def _limiter_unavailable() -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "success": False,
            "message": "Request protection is temporarily unavailable.",
            "data": None,
        },
    )
