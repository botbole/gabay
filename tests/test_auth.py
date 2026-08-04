"""Authentication foundation integration tests."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from pydantic import ValidationError
from sqlmodel import select

import app.core.db as db_module
from app.core.config import Settings, settings
from app.core.security import ALGORITHM, TokenValidationError, decode_token
from app.modules.auth.models import RefreshSession, User
from app.modules.auth.service import AuthError, auth_service


async def _bootstrap(client, password: str, username: str = "admin") -> dict:
    response = await client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password},
    )
    assert response.status_code == 201
    return response.json()["data"]


async def _login(client, password: str, username: str = "admin") -> dict:
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["data"]


async def test_first_user_is_bootstrapped_as_admin(client, auth_password):
    user = await _bootstrap(client, auth_password)
    assert user["role"] == "admin"
    assert user["username"] == "admin"
    assert "password_hash" not in user


async def test_bootstrap_closes_after_first_user(client, auth_password):
    await _bootstrap(client, auth_password)
    response = await client.post(
        "/api/v1/auth/register",
        json={"username": "second", "password": auth_password},
    )
    assert response.status_code == 401
    assert response.json()["success"] is False


async def test_admin_can_create_user_and_duplicate_is_rejected(
    client, admin_session, auth_password
):
    request = {
        "username": "member",
        "password": auth_password,
        "role": "admin",
    }
    created = await client.post(
        "/api/v1/auth/register",
        json=request,
        headers=admin_session["headers"],
    )
    duplicate = await client.post(
        "/api/v1/auth/register",
        json=request,
        headers=admin_session["headers"],
    )
    assert created.status_code == 201
    assert duplicate.status_code == 409


async def test_password_is_hashed_and_login_returns_access_token(client, auth_password):
    await _bootstrap(client, auth_password)
    with db_module.get_session() as session:
        user = session.exec(select(User).where(User.username == "admin")).one()
        assert user.password_hash != auth_password
        assert auth_service.verify_password(auth_password, user.password_hash)

    data = await _login(client, auth_password)
    payload = decode_token(data["access_token"], expected_type="access")
    assert payload["sub"] == data["user"]["id"]
    assert payload["role"] == "admin"


async def test_login_failure_is_generic(client, auth_password):
    await _bootstrap(client, auth_password)
    invalid_password = f"{auth_password}-invalid"
    unknown = await client.post(
        "/api/v1/auth/login",
        json={"username": "unknown", "password": invalid_password},
    )
    wrong_password = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": invalid_password},
    )
    assert unknown.status_code == wrong_password.status_code == 401
    assert unknown.json()["message"] == wrong_password.json()["message"]


async def test_refresh_rotates_token_and_reuse_revokes_family(client, auth_password):
    await _bootstrap(client, auth_password)
    await _login(client, auth_password)
    old_token = client.cookies.get(settings.REFRESH_COOKIE_NAME)

    refreshed = await client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200
    new_token = client.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert new_token and new_token != old_token

    with pytest.raises(AuthError, match="reuse"):
        auth_service.refresh(old_token)
    with pytest.raises(AuthError):
        auth_service.refresh(new_token)

    with db_module.get_session() as session:
        sessions = session.exec(select(RefreshSession)).all()
        assert len(sessions) == 2
        assert all(item.revoked_at is not None for item in sessions)


async def test_logout_revokes_refresh_family(client, auth_password):
    await _bootstrap(client, auth_password)
    await _login(client, auth_password)
    token = client.cookies.get(settings.REFRESH_COOKIE_NAME)
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    with pytest.raises(AuthError):
        auth_service.refresh(token)


async def test_disabled_user_cannot_login_or_use_existing_access_token(
    client, auth_password
):
    await _bootstrap(client, auth_password)
    data = await _login(client, auth_password)
    with db_module.get_session() as session:
        user = session.get(User, data["user"]["id"])
        user.is_active = False
        session.add(user)
        session.commit()

    login = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": auth_password},
    )
    register = await client.post(
        "/api/v1/auth/register",
        json={"username": "other", "password": auth_password},
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert login.status_code == 401
    assert register.status_code == 401


def test_expired_and_incorrect_token_types_are_rejected():
    now = datetime.now(timezone.utc)
    payload = {
        "sub": "user-id",
        "role": "admin",
        "type": "access",
        "jti": "token-id",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": now - timedelta(minutes=2),
        "exp": now - timedelta(minutes=1),
    }
    expired = jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
    with pytest.raises(TokenValidationError):
        decode_token(expired, expected_type="access")

    payload["iat"] = now
    payload["exp"] = now + timedelta(minutes=1)
    access = jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)
    with pytest.raises(TokenValidationError, match="type"):
        decode_token(access, expected_type="refresh")


async def test_malformed_bearer_token_is_rejected(client, auth_password):
    await _bootstrap(client, auth_password)
    response = await client.post(
        "/api/v1/auth/register",
        json={"username": "other", "password": auth_password},
        headers={"Authorization": "Bearer malformed"},
    )
    assert response.status_code == 401


def test_production_rejects_weak_secret_and_insecure_cookie(auth_password):
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            JWT_SECRET=auth_password[:5],
            REFRESH_COOKIE_SECURE=True,
        )
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            JWT_SECRET=auth_password,
            REFRESH_COOKIE_SECURE=False,
        )
