"""Azkarot module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.azkarot.api import router

definition = ModuleDefinition(
    module_id="azkarot",
    display_name="אזכרות",
    router=router,
    icon="Star",
    nav_path="/azkarot",
)

registry.register(definition)
