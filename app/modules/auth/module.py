"""Authentication module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.auth.api import router

definition = ModuleDefinition(
    module_id="auth",
    display_name="אימות משתמשים",
    router=router,
    icon="ShieldCheck",
)

registry.register(definition)
