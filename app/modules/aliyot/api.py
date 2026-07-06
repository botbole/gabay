"""Aliyot routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.base import APIResponse
from app.modules.aliyot.service import aliyot_service

router = APIRouter(prefix="/synagogue", tags=["aliyot"])


class BulkIdsRequest(BaseModel):
    ids: list[str]


class AliyaCreate(BaseModel):
    congregant_id: str
    parasha: str
    aliya_type: str
    date_str: str = ""
    minhag: str = ""
    donation_amount: float = 0.0
    notes: str = ""


@router.post("/aliyot", response_model=APIResponse, status_code=201)
async def assign_aliya(req: AliyaCreate):
    try:
        data = await aliyot_service.assign_aliya(
            congregant_id=req.congregant_id,
            parasha=req.parasha,
            aliya_type=req.aliya_type,
            date_str=req.date_str,
            minhag=req.minhag,
            donation_amount=req.donation_amount,
            notes=req.notes,
        )
        return APIResponse(message="Aliya assigned successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/aliyot", response_model=APIResponse)
async def list_aliyot():
    try:
        data = await aliyot_service.list_aliyot()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/aliyot/parasha/{parasha}", response_model=APIResponse)
async def get_aliyot_for_parasha(parasha: str):
    try:
        data = await aliyot_service.get_aliyot_for_parasha(parasha)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/aliyot/{congregant_id}/history", response_model=APIResponse)
async def get_aliya_history(congregant_id: str):
    try:
        data = await aliyot_service.get_aliya_history(congregant_id)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/aliyot/bulk-delete", response_model=APIResponse)
async def bulk_delete_aliyot(req: BulkIdsRequest):
    try:
        data = await aliyot_service.bulk_delete_aliyot(req.ids)
        return APIResponse(message=f"{data['deleted']} עליות נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
