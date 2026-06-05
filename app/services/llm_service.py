"""
LLM service – bridges incoming natural-language requests to application actions.

The intent-routing pattern used here lets the LLM interpret a free-text
command and dispatch it to the correct synagogue operation. As new operations
are defined, register them in ACTION_REGISTRY below.
"""

from __future__ import annotations

from openai.types.chat import ChatCompletionMessageParam

from app.core.config import settings
from app.core.llm import llm_client


# ---------------------------------------------------------------------------
# Action registry
# Each entry maps an action name to a brief description that the LLM sees.
# Replace stub callables with real service calls as features are implemented.
# ---------------------------------------------------------------------------
ACTION_REGISTRY: dict[str, str] = {
    "get_prayer_times": "Return the prayer schedule for a given date.",
    "list_members": "List synagogue members, optionally filtered by criteria.",
    "add_event": "Create a new synagogue event.",
    "record_donation": "Record a donation from a member.",
    "assign_seat": "Assign or look up a seat for a member.",
}


class LLMService:
    async def chat(self, user_message: str, history: list[dict] | None = None) -> str:
        """Send a message to the LLM and return the assistant reply."""
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": settings.LLM_SYSTEM_PROMPT},
        ]
        for turn in (history or []):
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})

        response = await llm_client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            max_tokens=settings.LLM_MAX_TOKENS,
            temperature=settings.LLM_TEMPERATURE,
        )
        return response.choices[0].message.content or ""

    async def dispatch_action(self, user_message: str) -> dict:
        """
        Ask the LLM to identify which registered action matches the user request,
        then execute it (stub). Returns the action name and a placeholder result.
        """
        action_list = "\n".join(
            f"- {name}: {desc}" for name, desc in ACTION_REGISTRY.items()
        )
        prompt = (
            f"Available actions:\n{action_list}\n\n"
            f"User request: \"{user_message}\"\n\n"
            "Reply with ONLY the action name that best matches the request, "
            "or 'unknown' if none apply."
        )
        action_name = (await self.chat(prompt)).strip().lower()

        if action_name not in ACTION_REGISTRY:
            return {"action": "unknown", "result": None, "message": "No matching action found."}

        # TODO: replace stub with real dispatch once services are implemented
        return {
            "action": action_name,
            "result": None,
            "message": f"Action '{action_name}' identified – execution not yet implemented.",
        }


llm_service = LLMService()
