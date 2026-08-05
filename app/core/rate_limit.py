"""Shared rate-limiting backends and privacy-safe request keys."""

from __future__ import annotations

import asyncio
import hashlib
import time
from dataclasses import dataclass
from typing import Protocol

from fastapi import Request

from app.core.config import settings


@dataclass(frozen=True, slots=True)
class RateLimitDecision:
    allowed: bool
    retry_after: int
    count: int


class RateLimitBackend(Protocol):
    async def get(self, key: str, *, limit: int, window: int) -> RateLimitDecision: ...

    async def hit(self, key: str, *, limit: int, window: int) -> RateLimitDecision: ...

    async def reset(self, key: str) -> None: ...


class InMemoryRateLimitBackend:
    def __init__(self) -> None:
        self._entries: dict[str, tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str, *, limit: int, window: int) -> RateLimitDecision:
        async with self._lock:
            count, expires_at = self._active_entry(key)
            retry_after = max(1, int(expires_at - time.monotonic())) if count else 0
            return RateLimitDecision(count < limit, retry_after, count)

    async def hit(self, key: str, *, limit: int, window: int) -> RateLimitDecision:
        async with self._lock:
            count, expires_at = self._active_entry(key)
            if not count:
                expires_at = time.monotonic() + window
            count += 1
            self._entries[key] = (count, expires_at)
            retry_after = max(1, int(expires_at - time.monotonic()))
            return RateLimitDecision(count <= limit, retry_after, count)

    async def reset(self, key: str) -> None:
        async with self._lock:
            self._entries.pop(key, None)

    def _active_entry(self, key: str) -> tuple[int, float]:
        count, expires_at = self._entries.get(key, (0, 0.0))
        if expires_at <= time.monotonic():
            self._entries.pop(key, None)
            return 0, 0.0
        return count, expires_at


class RedisRateLimitBackend:
    _HIT_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
"""

    def __init__(self, url: str) -> None:
        if not url:
            raise ValueError("RATE_LIMIT_REDIS_URL is required for the Redis backend")
        from redis.asyncio import Redis

        self._redis = Redis.from_url(url, decode_responses=True)

    async def get(self, key: str, *, limit: int, window: int) -> RateLimitDecision:
        pipe = self._redis.pipeline()
        pipe.get(key)
        pipe.ttl(key)
        raw_count, raw_ttl = await pipe.execute()
        count = int(raw_count or 0)
        retry_after = max(1, int(raw_ttl)) if count else 0
        return RateLimitDecision(count < limit, retry_after, count)

    async def hit(self, key: str, *, limit: int, window: int) -> RateLimitDecision:
        count, ttl = await self._redis.eval(self._HIT_SCRIPT, 1, key, window)
        return RateLimitDecision(
            int(count) <= limit,
            max(1, int(ttl)),
            int(count),
        )

    async def reset(self, key: str) -> None:
        await self._redis.delete(key)


_backend: RateLimitBackend | None = None


def get_rate_limit_backend() -> RateLimitBackend:
    global _backend
    if _backend is None:
        if settings.RATE_LIMIT_BACKEND == "redis":
            _backend = RedisRateLimitBackend(settings.RATE_LIMIT_REDIS_URL)
        else:
            _backend = InMemoryRateLimitBackend()
    return _backend


def set_rate_limit_backend(backend: RateLimitBackend | None) -> None:
    global _backend
    _backend = backend


def client_ip(request: Request) -> str:
    if settings.RATE_LIMIT_TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",", maxsplit=1)[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit_key(bucket: str, *identity_parts: str) -> str:
    identity = "\x1f".join(part.strip().lower() for part in identity_parts)
    digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()
    return f"gabay:rate-limit:{bucket}:{digest}"
