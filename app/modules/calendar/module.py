"""Calendar module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.calendar.api import router

definition = ModuleDefinition(
    module_id="calendar",
    display_name="לוח עברי",
    router=router,
    icon="Calendar",
    nav_path="/calendar",
)

registry.register(definition)
