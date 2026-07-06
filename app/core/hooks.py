"""
Event Bus – lightweight async pub/sub for inter-module communication.

Usage
-----
Register a handler:
    from app.core.hooks import hooks
    hooks.register("payment.recorded", my_handler)

Fire an event:
    await hooks.fire("payment.recorded", congregant_id=..., amount=...)

Handlers can be sync or async functions. Async handlers are awaited;
sync handlers are called directly.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any, Callable


class EventBus:
    def __init__(self) -> None:
        self._handlers: dict[str, list[Callable]] = defaultdict(list)

    def register(self, event: str, handler: Callable) -> None:
        """Register *handler* to be called when *event* is fired."""
        self._handlers[event].append(handler)

    async def fire(self, event: str, **kwargs: Any) -> None:
        """Fire *event*, invoking all registered handlers with *kwargs*."""
        for handler in self._handlers.get(event, []):
            if asyncio.iscoroutinefunction(handler):
                await handler(**kwargs)
            else:
                handler(**kwargs)

    def clear(self, event: str | None = None) -> None:
        """Remove all handlers (or handlers for a specific event)."""
        if event:
            self._handlers.pop(event, None)
        else:
            self._handlers.clear()


hooks = EventBus()
