"""
Test configuration and shared fixtures.

All tests run against an in-memory SQLite database that is created fresh
for every test function, so tests are fully isolated and never touch gabay.db.
"""

import os
import secrets
import sys

# Ensure Hebrew characters in print() work on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

# Point to an in-memory DB before any app code imports the real engine
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("LLM_API_KEY", "test-key")

import app.core.db as db_module  # noqa: E402  (must come after env override)
from app.core.rate_limit import (  # noqa: E402
    InMemoryRateLimitBackend,
    set_rate_limit_backend,
)
from main import app  # noqa: E402


# ---------------------------------------------------------------------------
# In-memory database – recreated for every test
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def use_test_db(monkeypatch):
    """
    Replace the global SQLAlchemy engine with an in-memory SQLite engine.
    StaticPool keeps a single connection so all sessions share the same DB.
    """
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)
    monkeypatch.setattr(db_module, "engine", test_engine)
    set_rate_limit_backend(InMemoryRateLimitBackend())
    yield
    set_rate_limit_backend(None)
    SQLModel.metadata.drop_all(test_engine)


# ---------------------------------------------------------------------------
# Async HTTP client that talks directly to the FastAPI app (no real network)
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client():
    """AsyncClient wired to the FastAPI app via ASGI transport."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture(scope="session")
def auth_password():
    """Generate one isolated credential for the test session."""
    return secrets.token_urlsafe(24)


@pytest_asyncio.fixture
async def admin_session(client, auth_password):
    """Bootstrap and log in the first administrator."""
    credentials = {"username": "admin", "password": auth_password}
    created = await client.post("/api/v1/auth/register", json=credentials)
    assert created.status_code == 201
    logged_in = await client.post("/api/v1/auth/login", json=credentials)
    assert logged_in.status_code == 200
    data = logged_in.json()["data"]
    return {
        "user": data["user"],
        "access_token": data["access_token"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


@pytest_asyncio.fixture
async def authenticated_client(client, admin_session):
    """Use the shared HTTP client as an authenticated administrator."""
    client.headers.update(admin_session["headers"])
    yield client
    client.headers.pop("Authorization", None)


async def _create_role_session(
    client,
    admin_session,
    auth_password,
    *,
    username: str,
    role: str,
    congregant_id: str | None = None,
):
    payload = {
        "username": username,
        "password": auth_password,
        "role": role,
        "congregant_id": congregant_id,
    }
    created = await client.post(
        "/api/v1/auth/register",
        json=payload,
        headers=admin_session["headers"],
    )
    assert created.status_code == 201
    logged_in = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": auth_password},
    )
    assert logged_in.status_code == 200
    data = logged_in.json()["data"]
    return {
        "user": data["user"],
        "access_token": data["access_token"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
    }


@pytest_asyncio.fixture
async def gabai_session(client, admin_session, auth_password):
    return await _create_role_session(
        client,
        admin_session,
        auth_password,
        username="gabai",
        role="gabai",
    )


@pytest_asyncio.fixture
async def congregant_session(client, admin_session, auth_password):
    created = await client.post(
        "/api/v1/synagogue/congregants",
        json={"first_name": "ישראל", "last_name": "ישראלי"},
        headers=admin_session["headers"],
    )
    assert created.status_code == 201
    return await _create_role_session(
        client,
        admin_session,
        auth_password,
        username="congregant-user",
        role="congregant",
        congregant_id=created.json()["data"]["id"],
    )


# ---------------------------------------------------------------------------
# Convenience fixtures for pre-created entities
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def congregant(authenticated_client):
    """Create and return a single test congregant."""
    r = await authenticated_client.post("/api/v1/synagogue/congregants", json={
        "first_name": "משה",
        "last_name": "כהן",
        "is_kohen": True,
        "member_type": "regular",
    })
    assert r.status_code == 201
    return r.json()["data"]
