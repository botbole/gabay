"""
Test configuration and shared fixtures.

All tests run against an in-memory SQLite database that is created fresh
for every test function, so tests are fully isolated and never touch gabay.db.
"""

import os
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
    yield
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


# ---------------------------------------------------------------------------
# Convenience fixtures for pre-created entities
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def congregant(client):
    """Create and return a single test congregant."""
    r = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "משה",
        "last_name": "כהן",
        "is_kohen": True,
        "member_type": "regular",
    })
    assert r.status_code == 201
    return r.json()["data"]
