"""Payments module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.payments.api import router

definition = ModuleDefinition(
    module_id="payments",
    display_name="תשלומים",
    router=router,
    icon="CreditCard",
    nav_path="/payments",
)

registry.register(definition)
