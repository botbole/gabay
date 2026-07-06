"""Congregants module definition – registers with the ModuleRegistry."""

from app.core.registry import ModuleDefinition, registry
from app.modules.congregants.api import router

definition = ModuleDefinition(
    module_id="congregants",
    display_name="מתפללים",
    router=router,
    icon="Users",
    nav_path="/congregants",
)

registry.register(definition)
