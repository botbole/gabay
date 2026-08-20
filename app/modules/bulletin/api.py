"""Weekly bulletin routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.deps import require_operational
from app.models.base import APIResponse
from app.modules.auth.models import User
from app.modules.bulletin.service import ALL_SECTIONS, bulletin_service

router = APIRouter(
    prefix="/synagogue",
    tags=["bulletin"],
    dependencies=[Depends(require_operational)],
)


class BulletinConfigUpdate(BaseModel):
    rabbi: Optional[str] = None
    address: Optional[str] = None
    announcements: Optional[str] = None
    default_sections: Optional[str] = None


class WeekOverrideRequest(BaseModel):
    week_start: str
    sections: list[str]


@router.get("/bulletin", response_model=APIResponse)
async def get_bulletin(
    date: Optional[str] = Query(None),
    sections: Optional[str] = Query(None),
    actor: User = Depends(require_operational),
):
    try:
        data = await bulletin_service.get_bulletin(
            date_str=date,
            sections=sections,
            actor=actor,
        )
        return APIResponse(data=data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/bulletin/config", response_model=APIResponse)
async def get_bulletin_config(actor: User = Depends(require_operational)):
    try:
        data = bulletin_service.get_config(actor=actor)
        data["available_sections"] = ALL_SECTIONS
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/bulletin/config", response_model=APIResponse)
async def update_bulletin_config(
    req: BulletinConfigUpdate,
    actor: User = Depends(require_operational),
):
    try:
        data = bulletin_service.update_config(
            actor=actor,
            **req.model_dump(exclude_none=True),
        )
        return APIResponse(message="הגדרות הלוח השבועי עודכנו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.put("/bulletin/week", response_model=APIResponse)
async def save_week_override(
    req: WeekOverrideRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = bulletin_service.save_week_override(
            week_start=req.week_start,
            sections=req.sections,
            actor=actor,
        )
        return APIResponse(message="קטעי השבוע נשמרו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
