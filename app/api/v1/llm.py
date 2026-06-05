"""
LLM interaction router.

Two endpoints:
  POST /llm/chat          – free-form conversation with the Gabay assistant
  POST /llm/action        – natural-language action dispatch
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
    """Send a message to the Gabay LLM assistant and receive a reply."""
    try:
        reply = await llm_service.chat(request.message, request.history)
        return APIResponse(data={"reply": reply})
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/action", response_model=APIResponse)
async def dispatch_action(request: ActionRequest):
    """Interpret a natural-language request and route it to the matching operation."""
    try:
        result = await llm_service.dispatch_action(request.message)
        return APIResponse(data=result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
