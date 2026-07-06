"""Payment routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.models.base import APIResponse
from app.modules.payments.service import payment_service

router = APIRouter(prefix="/synagogue", tags=["payments"])


class BulkIdsRequest(BaseModel):
    ids: list[str]


class PaymentCreate(BaseModel):
    congregant_id: str
    amount: float
    purpose: str
    currency: str = "ILS"
    notes: str = ""
    payment_date: str = ""


@router.post("/payments", response_model=APIResponse, status_code=201)
async def record_payment(req: PaymentCreate):
    try:
        data = await payment_service.record_payment(
            congregant_id=req.congregant_id,
            amount=req.amount,
            purpose=req.purpose,
            currency=req.currency,
            notes=req.notes,
            payment_date=req.payment_date,
        )
        return APIResponse(message="Payment recorded successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/payments", response_model=APIResponse)
async def get_all_payments(
    purpose: Optional[str] = Query(None),
):
    try:
        data = await payment_service.get_all_payments(purpose=purpose)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/payments/bulk-delete", response_model=APIResponse)
async def bulk_delete_payments(req: BulkIdsRequest):
    try:
        data = await payment_service.bulk_delete_payments(req.ids)
        return APIResponse(message=f"{data['deleted']} תשלומים נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/payments/pending", response_model=APIResponse)
async def get_pending_payments():
    try:
        data = await payment_service.get_pending_payments()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/payments/{congregant_id}/history", response_model=APIResponse)
async def get_payment_history(congregant_id: str):
    try:
        data = await payment_service.get_payment_history(congregant_id)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
