"""Smachot module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.smachot.api import router

definition = ModuleDefinition(
    module_id="smachot",
    display_name="שמחות",
    router=router,
    icon="Heart",
    nav_path="/smachot",
)

registry.register(definition)
