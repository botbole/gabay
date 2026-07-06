"""Azkarot routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.base import APIResponse
from app.modules.azkarot.service import azkara_service

router = APIRouter(prefix="/synagogue", tags=["azkarot"])


class BulkIdsRequest(BaseModel):
    ids: list[str]


class AzkaraCreate(BaseModel):
    congregant_id: str
    deceased_name: str
    deceased_hebrew_name: str = ""
    relation: str = ""
    gregorian_date: str = ""
    hebrew_day: int = 0
    hebrew_month: int = 0
    year_occurred: Optional[int] = None
    notes: str = ""


@router.post("/azkarot", response_model=APIResponse, status_code=201)
async def add_azkara(req: AzkaraCreate):
    try:
        data = await azkara_service.add_azkara(
            congregant_id=req.congregant_id,
            deceased_name=req.deceased_name,
            deceased_hebrew_name=req.deceased_hebrew_name,
            relation=req.relation,
            gregorian_date=req.gregorian_date,
            hebrew_day=req.hebrew_day,
            hebrew_month=req.hebrew_month,
            year_occurred=req.year_occurred,
            notes=req.notes,
        )
        return APIResponse(message="Azkara added successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/azkarot/upcoming", response_model=APIResponse)
async def get_upcoming_azkarot(
    days_ahead: int = Query(30),
):
    try:
        data = await azkara_service.get_upcoming_azkarot(days_ahead=days_ahead)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/azkarot", response_model=APIResponse)
async def list_azkarot(
    congregant_id: Optional[str] = Query(None),
):
    try:
        data = await azkara_service.list_azkarot(congregant_id=congregant_id)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/azkarot/{azkara_id}", response_model=APIResponse)
async def get_azkara(azkara_id: str):
    try:
        data = await azkara_service.get_azkara(azkara_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Azkara '{azkara_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/azkarot/{azkara_id}", response_model=APIResponse)
async def delete_azkara(azkara_id: str):
    try:
        deleted = await azkara_service.delete_azkara(azkara_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Azkara '{azkara_id}' not found.")
        return APIResponse(message="Azkara deleted.", data={"id": azkara_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/azkarot/bulk-delete", response_model=APIResponse)
async def bulk_delete_azkarot(req: BulkIdsRequest):
    try:
        data = await azkara_service.bulk_delete_azkarot(req.ids)
        return APIResponse(message=f"{data['deleted']} אזכרות נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
