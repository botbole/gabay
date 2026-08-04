"""Seating routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.deps import require_operational
from app.models.base import APIResponse
from app.modules.auth.models import User
from app.modules.seating.service import seating_service

router = APIRouter(
    prefix="/synagogue",
    tags=["seating"],
    dependencies=[Depends(require_operational)],
)


class BulkIdsRequest(BaseModel):
    ids: list[str]


class PlaceCreate(BaseModel):
    section: str
    row: str
    place_number: int
    congregant_id: Optional[str] = None
    is_reserved: bool = False
    annual_fee: float = 0.0
    notes: str = ""


class PlaceAssign(BaseModel):
    congregant_id: str
    is_reserved: bool = True
    annual_fee: float = 0.0


@router.post("/places", response_model=APIResponse, status_code=201)
async def add_place(
    req: PlaceCreate,
    actor: User = Depends(require_operational),
):
    try:
        data = await seating_service.add_place(
            section=req.section,
            row=req.row,
            place_number=req.place_number,
            congregant_id=req.congregant_id,
            is_reserved=req.is_reserved,
            annual_fee=req.annual_fee,
            notes=req.notes,
            actor=actor,
        )
        return APIResponse(message="Place added successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/places", response_model=APIResponse)
async def list_places(
    section: Optional[str] = Query(None),
    only_free: bool = Query(False),
):
    try:
        data = await seating_service.list_places(section=section, only_free=only_free)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/places/{place_id}", response_model=APIResponse)
async def get_place(place_id: str):
    try:
        data = await seating_service.get_place(place_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/places/{place_id}/assign", response_model=APIResponse)
async def assign_place(
    place_id: str,
    req: PlaceAssign,
    actor: User = Depends(require_operational),
):
    try:
        data = await seating_service.assign_place(
            place_id=place_id,
            congregant_id=req.congregant_id,
            is_reserved=req.is_reserved,
            annual_fee=req.annual_fee,
            actor=actor,
        )
        if data is None:
            raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found.")
        return APIResponse(message="Place assigned successfully.", data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/places/{place_id}/unassign", response_model=APIResponse)
async def unassign_place(
    place_id: str,
    actor: User = Depends(require_operational),
):
    try:
        data = await seating_service.unassign_place(place_id, actor=actor)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found.")
        return APIResponse(message="Place unassigned.", data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/places/bulk-delete", response_model=APIResponse)
async def bulk_delete_places(
    req: BulkIdsRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = await seating_service.bulk_delete_places(req.ids, actor=actor)
        return APIResponse(message=f"{data['deleted']} מושבים נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants/{congregant_id}/place", response_model=APIResponse)
async def get_congregant_place(congregant_id: str):
    try:
        data = await seating_service.get_congregant_place(congregant_id)
        if data is None:
            raise HTTPException(status_code=404, detail="No seat assigned to this congregant.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
