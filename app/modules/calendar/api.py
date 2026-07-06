"""Calendar routes."""

from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.models.base import APIResponse
from app.modules.calendar.service import calendar_service

router = APIRouter(prefix="/synagogue", tags=["calendar"])


@router.get("/info", response_model=APIResponse)
async def get_synagogue_info():
    return APIResponse(data={
        "name": "Gabay Synagogue",
        "operations": [
            "congregant_management", "payments", "aliyot_latora",
            "places", "azkarot", "smachot", "hebrew_calendar",
        ],
        "storage": "SQLite (gabay.db)",
    })


@router.get("/calendar/gregorian-to-hebrew", response_model=APIResponse)
async def gregorian_to_hebrew(
    date: str = Query(..., description="Gregorian date in YYYY-MM-DD format"),
):
    try:
        data = await calendar_service.convert_gregorian_to_hebrew(date)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/hebrew-to-gregorian", response_model=APIResponse)
async def hebrew_to_gregorian(
    year: int = Query(...),
    month: int = Query(...),
    day: int = Query(...),
):
    try:
        data = await calendar_service.convert_hebrew_to_gregorian(year, month, day)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/next-occurrence", response_model=APIResponse)
async def next_hebrew_occurrence(
    month: int = Query(...),
    day: int = Query(...),
    from_date: str = Query(""),
):
    try:
        data = await calendar_service.get_next_hebrew_occurrence(month, day, from_date)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/months", response_model=APIResponse)
async def list_hebrew_months():
    try:
        data = await calendar_service.list_hebrew_months()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/month-view", response_model=APIResponse)
async def get_calendar_month_view(
    year: int = Query(...),
    month: int = Query(...),
):
    try:
        data = await calendar_service.get_calendar_month_view(year, month)
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/day-times", response_model=APIResponse)
async def get_calendar_day_times(
    date: str = Query(...),
):
    try:
        data = await calendar_service.get_calendar_day_times(date)
        if data is None:
            raise HTTPException(status_code=400, detail=f"תאריך לא תקין: {date}")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"שגיאה בפנייה לשירות הזמנים: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
