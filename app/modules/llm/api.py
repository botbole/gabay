"""LLM (chat assistant) routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import require_operational
from app.models.base import APIResponse
from app.modules.auth.models import User
from app.modules.llm.service import llm_service

router = APIRouter(
    prefix="/llm",
    tags=["llm"],
    dependencies=[Depends(require_operational)],
)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None


class ActionRequest(BaseModel):
    message: str


@router.post("/chat", response_model=APIResponse)
async def chat(
    request: ChatRequest,
    actor: User = Depends(require_operational),
):
    try:
        result = await llm_service.chat(request.message, request.history, actor=actor)
        return APIResponse(data=result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/action", response_model=APIResponse)
async def dispatch_action(
    request: ActionRequest,
    actor: User = Depends(require_operational),
):
    """Backward-compatible action endpoint – delegates to /chat."""
    try:
        result = await llm_service.chat(request.message, actor=actor)
        return APIResponse(data=result)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
