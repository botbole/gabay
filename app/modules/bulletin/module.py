"""Bulletin module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.bulletin.api import router

definition = ModuleDefinition(
    module_id="bulletin",
    display_name="לוח שבועי",
    router=router,
    icon="Newspaper",
    nav_path="/bulletin",
)

registry.register(definition)
