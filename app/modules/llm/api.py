"""LLM (chat assistant) routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.base import APIResponse
from app.modules.llm.service import llm_service

router = APIRouter(prefix="/llm", tags=["llm"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None


class ActionRequest(BaseModel):
    message: str


@router.post("/chat", response_model=APIResponse)
async def chat(request: ChatRequest):
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
