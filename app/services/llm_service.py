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
from app.services.synagogue_service import synagogue_service


# ---------------------------------------------------------------------------
# Action registry
# Each entry maps an action name to a brief description that the LLM sees.
# Replace stub callables with real service calls as features are implemented.
# ---------------------------------------------------------------------------
ACTION_REGISTRY: dict[str, str] = {
    # Congregant management
    "add_congregant":      "Register a new person (congregant / mispallel) in the synagogue.",
    "get_congregant":      "Retrieve details about a specific congregant.",
    "update_congregant":   "Update information (phone, Hebrew name, etc.) for an existing congregant.",
    "list_congregants":    "List all registered congregants.",

    # Payments & donations
    "record_payment":      "Record a payment or donation from a congregant.",
    "get_payment_history": "Show the payment history for a specific congregant.",
    "get_pending_payments":"List all congregants who have outstanding balances.",

    # Aliya La-Torah
    "assign_aliya":            "Assign an Aliya La-Torah to a congregant for a specific Parasha.",
    "get_aliyot_for_parasha":  "Show who is assigned each Aliya for a given Parasha.",
    "get_aliya_history":       "Show the Aliya history for a specific congregant.",
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

        # Dispatch to the matching service method
        dispatch_map = {
            "add_congregant":          lambda: synagogue_service.add_congregant("Unknown", "Unknown"),
            "get_congregant":          lambda: synagogue_service.get_congregant("1"),
            "update_congregant":       lambda: synagogue_service.update_congregant("1", {}),
            "list_congregants":        lambda: synagogue_service.list_congregants(),
            "record_payment":          lambda: synagogue_service.record_payment("1", 0.0, "general"),
            "get_payment_history":     lambda: synagogue_service.get_payment_history("1"),
            "get_pending_payments":    lambda: synagogue_service.get_pending_payments(),
            "assign_aliya":            lambda: synagogue_service.assign_aliya("1", "Unknown", "Kohen"),
            "get_aliyot_for_parasha":  lambda: synagogue_service.get_aliyot_for_parasha("Unknown"),
            "get_aliya_history":       lambda: synagogue_service.get_aliya_history("1"),
        }

        result = await dispatch_map[action_name]()
        return {
            "action": action_name,
            "result": result,
            "message": (
                f"Action '{action_name}' executed. "
                "Pass specific parameters via the API for precise results."
            ),
        }


llm_service = LLMService()
