"""
Backward-compatibility shim.

LLM service now lives in app/modules/llm/service.py.
"""

from app.modules.llm.service import LLMService, llm_service, TOOLS  # noqa: F401
