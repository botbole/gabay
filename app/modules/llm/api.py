"""LLM (chat assistant) routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.authorization import AuthScope, AuthorizationError
from app.core.config import settings
from app.core.deps import require_operational, require_operational_scope
from app.core.rate_limit import client_ip, get_rate_limit_backend, rate_limit_key
from app.models.base import APIResponse
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
    payload: ChatRequest,
    request: Request,
    actor: AuthScope = Depends(require_operational_scope),
):
    limited = await _llm_rate_limit_response(request, actor)
    if limited:
        return limited
    try:
        result = await llm_service.chat(payload.message, payload.history, actor=actor)
        return APIResponse(data=result)
    except AuthorizationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/action", response_model=APIResponse)
async def dispatch_action(
    payload: ActionRequest,
    request: Request,
    actor: AuthScope = Depends(require_operational_scope),
):
    """Backward-compatible action endpoint – delegates to /chat."""
    limited = await _llm_rate_limit_response(request, actor)
    if limited:
        return limited
    try:
        result = await llm_service.chat(payload.message, actor=actor)
        return APIResponse(data=result)
    except AuthorizationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


async def _llm_rate_limit_response(
    request: Request,
    actor: AuthScope,
) -> JSONResponse | None:
    try:
        decision = await get_rate_limit_backend().hit(
            rate_limit_key("llm-chat", client_ip(request), actor.actor_id),
            limit=settings.LLM_CHAT_RATE_LIMIT,
            window=settings.LLM_CHAT_RATE_WINDOW_SECONDS,
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "message": "Request protection is temporarily unavailable.",
                "data": None,
            },
        )
    if decision.allowed:
        return None
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        headers={"Retry-After": str(max(1, decision.retry_after))},
        content={
            "success": False,
            "message": "Too many requests. Please try again later.",
            "data": None,
        },
    )
