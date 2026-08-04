"""Prayer Schedule module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.prayer_schedule.api import router

definition = ModuleDefinition(
    module_id="prayer_schedule",
    display_name="לוח תפילות ושיעורים",
    router=router,
    icon="Clock",
    nav_path="/schedule",
)

registry.register(definition)
