"""
Module Registry – central registry for all application modules.

Each module registers itself with a ModuleDefinition.
main.py reads ENABLED_MODULES and attaches only the enabled routers.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import APIRouter


@dataclass
class ModuleDefinition:
    module_id: str
    display_name: str
    router: APIRouter
    icon: str = "puzzle"           # lucide-react icon name for the frontend sidebar
    nav_path: str = ""             # frontend route path, e.g. "/congregants"
    default_enabled: bool = True


class ModuleRegistry:
    def __init__(self) -> None:
        self._modules: dict[str, ModuleDefinition] = {}

    def register(self, mod: ModuleDefinition) -> None:
        self._modules[mod.module_id] = mod

    def get_all(self) -> list[ModuleDefinition]:
        return list(self._modules.values())

    def get_enabled(self, enabled_ids: list[str]) -> list[ModuleDefinition]:
        return [self._modules[mid] for mid in enabled_ids if mid in self._modules]

    def is_registered(self, module_id: str) -> bool:
        return module_id in self._modules

    def manifest(self, enabled_ids: list[str]) -> list[dict]:
        """Return a JSON-serialisable list of enabled module metadata for the frontend."""
        return [
            {
                "module_id": mod.module_id,
                "display_name": mod.display_name,
                "icon": mod.icon,
                "nav_path": mod.nav_path,
            }
            for mod in self.get_enabled(enabled_ids)
        ]


registry = ModuleRegistry()
