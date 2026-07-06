"""LLM (chat assistant) module definition."""

from app.core.registry import ModuleDefinition, registry
from app.modules.llm.api import router

definition = ModuleDefinition(
    module_id="llm",
    display_name="עוזר גבאי AI",
    router=router,
    icon="MessageCircle",
    nav_path="/chat",
)

registry.register(definition)
