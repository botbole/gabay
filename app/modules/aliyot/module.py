"""Aliyot module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.aliyot.api import router

definition = ModuleDefinition(
    module_id="aliyot",
    display_name="עליות לתורה",
    router=router,
    icon="BookOpen",
    nav_path="/aliyot",
)

registry.register(definition)
