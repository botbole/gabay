"""
LLM client factory.

Supports OpenAI-compatible providers (OpenAI, Azure OpenAI, Ollama, etc.).
Swap the provider via the LLM_PROVIDER / LLM_BASE_URL env vars – no code changes needed.
"""

from openai import AsyncOpenAI

from app.core.config import settings


def get_llm_client() -> AsyncOpenAI:
    """Return a configured AsyncOpenAI client for the active provider."""
    kwargs: dict = {"api_key": settings.LLM_API_KEY or "no-key"}
    if settings.LLM_BASE_URL:
        kwargs["base_url"] = settings.LLM_BASE_URL
    return AsyncOpenAI(**kwargs)


# Module-level singleton – import this wherever you need the client
llm_client = get_llm_client()
