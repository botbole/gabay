"""
Backward-compatibility shim.

LLM routes are now served by app/modules/llm/api.py via the Module Registry.
"""

from app.modules.llm.api import router  # noqa: F401
