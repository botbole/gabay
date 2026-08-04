"""Prayer Schedule routes."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from app.core.deps import require_operational
from app.models.base import APIResponse
from app.modules.auth.models import User
from app.modules.prayer_schedule.service import prayer_schedule_service

router = APIRouter(
    prefix="/synagogue",
    tags=["prayer_schedule"],
    dependencies=[Depends(require_operational)],
)


# ─── Request schemas ─────────────────────────────────────────────────────────

def _days_to_str(days: Optional[list[int]]) -> Optional[str]:
    """Convert list[int] from API → comma-separated string for storage."""
    if days is None:
        return None
    return ",".join(str(d) for d in sorted(set(days)))


class PrayerRuleCreate(BaseModel):
    name: str
    day_type: str
    anchor: str
    offset_minutes: int = 0
    exact_time: Optional[str] = None
    free_text: Optional[str] = None
    no_auto_time: bool = False
    is_lesson: bool = False
    days_of_week: Optional[list[int]] = None   # [0,1,5] = Sun, Mon, Fri; None = every day
    notes: str = ""
    display_order: int = 0
    is_active: bool = True


class PrayerRuleUpdate(BaseModel):
    name: Optional[str] = None
    anchor: Optional[str] = None
    offset_minutes: Optional[int] = None
    exact_time: Optional[str] = None
    free_text: Optional[str] = None
    no_auto_time: Optional[bool] = None
    is_lesson: Optional[bool] = None
    days_of_week: Optional[list[int]] = None   # None means "clear selection" (every day)
    notes: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ReorderRequest(BaseModel):
    day_type: str
    ordered_ids: list[str]


class SpecialDayCreate(BaseModel):
    name: str
    hebrew_month: int
    hebrew_day: int
    notes: str = ""


# ─── Prayer Rules ─────────────────────────────────────────────────────────────

@router.get("/prayer-rules", response_model=APIResponse)
async def list_prayer_rules(day_type: Optional[str] = None):
    try:
        rules = prayer_schedule_service.get_rules(day_type)
        return APIResponse(data={"rules": rules, "total": len(rules)})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/prayer-rules", response_model=APIResponse, status_code=201)
async def create_prayer_rule(
    req: PrayerRuleCreate,
    actor: User = Depends(require_operational),
):
    try:
        rule = prayer_schedule_service.create_rule(
            name=req.name,
            day_type=req.day_type,
            anchor=req.anchor,
            offset_minutes=req.offset_minutes,
            exact_time=req.exact_time,
            free_text=req.free_text,
            no_auto_time=req.no_auto_time,
            is_lesson=req.is_lesson,
            days_of_week=_days_to_str(req.days_of_week),
            notes=req.notes,
            display_order=req.display_order,
            is_active=req.is_active,
            actor=actor,
        )
        return APIResponse(message="כלל תפילה נוסף בהצלחה.", data=rule)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/prayer-rules/{rule_id}", response_model=APIResponse)
async def update_prayer_rule(
    rule_id: str,
    req: PrayerRuleUpdate,
    actor: User = Depends(require_operational),
):
    try:
        fields = req.model_dump(exclude_unset=True)
        if 'days_of_week' in fields:
            fields['days_of_week'] = _days_to_str(fields['days_of_week'])
        rule = prayer_schedule_service.update_rule(rule_id, actor=actor, **fields)
        return APIResponse(message="כלל תפילה עודכן בהצלחה.", data=rule)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/prayer-rules/{rule_id}", response_model=APIResponse)
async def delete_prayer_rule(
    rule_id: str,
    actor: User = Depends(require_operational),
):
    try:
        data = prayer_schedule_service.delete_rule(rule_id, actor=actor)
        return APIResponse(message="כלל תפילה נמחק.", data=data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/prayer-rules/reorder", response_model=APIResponse)
async def reorder_prayer_rules(
    req: ReorderRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = prayer_schedule_service.reorder_rules(
            req.day_type,
            req.ordered_ids,
            actor=actor,
        )
        return APIResponse(message="סדר הכללים עודכן.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ─── Schedule calculation ─────────────────────────────────────────────────────

@router.get("/schedule", response_model=APIResponse)
async def get_schedule(date: str):
    """Return calculated prayer times for a specific date (YYYY-MM-DD)."""
    try:
        data = await prayer_schedule_service.calculate_times(date)
        return APIResponse(data=data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/schedule/generate", response_model=APIResponse)
async def generate_weekly_schedule(week_start: Optional[str] = None):
    """Generate a formatted Hebrew weekly prayer schedule text."""
    try:
        data = await prayer_schedule_service.generate_weekly(week_start)
        return APIResponse(data=data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/schedule/week", response_model=APIResponse)
async def get_week_schedule(from_date: str):
    """Return calculated prayer times for 7 days starting from from_date (YYYY-MM-DD)."""
    try:
        data = await prayer_schedule_service.get_week_schedule(from_date)
        return APIResponse(data=data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ─── Special Days ─────────────────────────────────────────────────────────────

@router.get("/special-days", response_model=APIResponse)
async def list_special_days():
    try:
        days = prayer_schedule_service.get_special_days()
        return APIResponse(data={"days": days, "total": len(days)})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/special-days", response_model=APIResponse, status_code=201)
async def create_special_day(
    req: SpecialDayCreate,
    actor: User = Depends(require_operational),
):
    try:
        day = prayer_schedule_service.create_special_day(
            name=req.name,
            hebrew_month=req.hebrew_month,
            hebrew_day=req.hebrew_day,
            notes=req.notes,
            actor=actor,
        )
        return APIResponse(message="יום מיוחד נוסף בהצלחה.", data=day)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/special-days/{day_id}", response_model=APIResponse)
async def delete_special_day(
    day_id: str,
    actor: User = Depends(require_operational),
):
    try:
        data = prayer_schedule_service.delete_special_day(day_id, actor=actor)
        return APIResponse(message="יום מיוחד נמחק.", data=data)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
