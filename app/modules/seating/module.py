"""Seating module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.seating.api import router

definition = ModuleDefinition(
    module_id="seating",
    display_name="מפת מושבים",
    router=router,
    icon="Armchair",
    nav_path="/seating",
)

registry.register(definition)
