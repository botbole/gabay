"""Smachot routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.deps import require_operational
from app.models.base import APIResponse
from app.modules.auth.models import User
from app.modules.smachot.service import simcha_service

router = APIRouter(
    prefix="/synagogue",
    tags=["smachot"],
    dependencies=[Depends(require_operational)],
)


class BulkIdsRequest(BaseModel):
    ids: list[str]


class SimchaCreate(BaseModel):
    congregant_id: str
    occasion_type: str
    description: str = ""
    gregorian_date: str = ""
    hebrew_day: int = 0
    hebrew_month: int = 0
    parasha: str = ""
    year_occurred: Optional[int] = None
    notes: str = ""


@router.post("/smachot", response_model=APIResponse, status_code=201)
async def add_simcha(
    req: SimchaCreate,
    actor: User = Depends(require_operational),
):
    try:
        data = await simcha_service.add_simcha(
            congregant_id=req.congregant_id,
            occasion_type=req.occasion_type,
            description=req.description,
            gregorian_date=req.gregorian_date,
            hebrew_day=req.hebrew_day,
            hebrew_month=req.hebrew_month,
            parasha=req.parasha,
            year_occurred=req.year_occurred,
            notes=req.notes,
            actor=actor,
        )
        return APIResponse(message="Simcha added successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/smachot/upcoming", response_model=APIResponse)
async def get_upcoming_smachot(
    days_ahead: int = Query(30),
    occasion_type: Optional[str] = Query(None),
):
    try:
        data = await simcha_service.get_upcoming_smachot(
            days_ahead=days_ahead, occasion_type=occasion_type
        )
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/smachot", response_model=APIResponse)
async def list_smachot(
    congregant_id: Optional[str] = Query(None),
    occasion_type: Optional[str] = Query(None),
):
    try:
        data = await simcha_service.list_smachot(
            congregant_id=congregant_id, occasion_type=occasion_type
        )
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/smachot/{simcha_id}", response_model=APIResponse)
async def get_simcha(simcha_id: str):
    try:
        data = await simcha_service.get_simcha(simcha_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Simcha '{simcha_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/smachot/{simcha_id}", response_model=APIResponse)
async def delete_simcha(
    simcha_id: str,
    actor: User = Depends(require_operational),
):
    try:
        deleted = await simcha_service.delete_simcha(simcha_id, actor=actor)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Simcha '{simcha_id}' not found.")
        return APIResponse(message="Simcha deleted.", data={"id": simcha_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/smachot/bulk-delete", response_model=APIResponse)
async def bulk_delete_smachot(
    req: BulkIdsRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = await simcha_service.bulk_delete_smachot(req.ids, actor=actor)
        return APIResponse(message=f"{data['deleted']} שמחות נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
