"""Endpoint and backend rate-limit tests."""

from app.core.config import settings
from app.core.rate_limit import (
    InMemoryRateLimitBackend,
    RedisRateLimitBackend,
)
from app.modules.llm.service import llm_service


async def test_memory_backend_hit_get_and_reset():
    backend = InMemoryRateLimitBackend()

    assert (await backend.get("key", limit=1, window=60)).allowed
    assert (await backend.hit("key", limit=1, window=60)).allowed
    blocked = await backend.hit("key", limit=1, window=60)
    assert not blocked.allowed
    assert blocked.retry_after > 0

    await backend.reset("key")
    assert (await backend.get("key", limit=1, window=60)).allowed


async def test_login_limit_has_uniform_non_enumerating_429(
    client,
    admin_session,
    auth_password,
    monkeypatch,
):
    monkeypatch.setattr(settings, "LOGIN_FAILED_RATE_LIMIT", 1)
    payloads = [
        {"username": "admin", "password": "definitely-wrong"},
        {"username": "missing-user", "password": auth_password},
    ]
    limited_bodies = []

    for payload in payloads:
        first = await client.post("/api/v1/auth/login", json=payload)
        second = await client.post("/api/v1/auth/login", json=payload)
        assert first.status_code == 401
        assert second.status_code == 429
        assert int(second.headers["retry-after"]) > 0
        limited_bodies.append(second.content)

    assert limited_bodies[0] == limited_bodies[1]


async def test_refresh_has_an_independent_limit(client, monkeypatch):
    monkeypatch.setattr(settings, "REFRESH_RATE_LIMIT", 1)

    first = await client.post("/api/v1/auth/refresh")
    second = await client.post("/api/v1/auth/refresh")

    assert first.status_code == 401
    assert second.status_code == 429
    assert int(second.headers["retry-after"]) > 0


async def test_llm_chat_is_limited_per_authenticated_actor(
    client,
    admin_session,
    monkeypatch,
):
    monkeypatch.setattr(settings, "LLM_CHAT_RATE_LIMIT", 1)

    async def fake_chat(user_message, history=None, *, actor):
        return {"reply": user_message, "actions": []}

    monkeypatch.setattr(llm_service, "chat", fake_chat)
    first = await client.post(
        "/api/v1/llm/chat",
        json={"message": "first"},
        headers=admin_session["headers"],
    )
    second = await client.post(
        "/api/v1/llm/chat",
        json={"message": "second"},
        headers=admin_session["headers"],
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert int(second.headers["retry-after"]) > 0


class _FakePipeline:
    def get(self, key):
        return self

    def ttl(self, key):
        return self

    async def execute(self):
        return ["2", 30]


class _FakeRedis:
    def pipeline(self):
        return _FakePipeline()

    async def eval(self, script, key_count, key, window):
        return [3, window]

    async def delete(self, key):
        return 1


async def test_redis_backend_contract_uses_shared_atomic_counter():
    backend = RedisRateLimitBackend.__new__(RedisRateLimitBackend)
    backend._redis = _FakeRedis()

    current = await backend.get("shared", limit=2, window=30)
    blocked = await backend.hit("shared", limit=2, window=30)
    await backend.reset("shared")

    assert not current.allowed
    assert current.retry_after == 30
    assert not blocked.allowed
    assert blocked.count == 3
