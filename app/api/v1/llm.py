"""
LLM interaction router.

POST /llm/chat   – conversational endpoint.
                   The LLM may call tools transparently; the caller always
                   receives a "reply" string and an optional "actions" list.

POST /llm/action – thin wrapper kept for backward-compatibility.
                   Internally delegates to /chat.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.base import APIResponse
from app.services.llm_service import llm_service

router = APIRouter(prefix="/llm", tags=["llm"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None


class ActionRequest(BaseModel):
    message: str


@router.post("/chat", response_model=APIResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the Gabay assistant.

    The assistant understands Hebrew naturally and can perform all synagogue
    operations autonomously using function calling.  It returns:
      - reply:   the assistant's Hebrew text response
      - actions: list of tools that were invoked (may be empty)
    """
    try:
        result = await llm_service.chat(request.message, request.history)
        return APIResponse(data=result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/action", response_model=APIResponse)
async def dispatch_action(request: ActionRequest):
    """Backward-compatible action endpoint – delegates to /chat."""
    try:
        result = await llm_service.chat(request.message)
        return APIResponse(data=result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
