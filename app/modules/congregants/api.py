"""Congregant routes (part of the /synagogue prefix)."""

from __future__ import annotations

import csv
import io
import re
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

from app.core.deps import require_operational
from app.models.base import APIResponse
from app.modules.auth.models import User
from app.modules.congregants.service import congregant_service

router = APIRouter(
    prefix="/synagogue",
    tags=["congregants"],
    dependencies=[Depends(require_operational)],
)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class BulkIdsRequest(BaseModel):
    ids: list[str]


class CongregantCreate(BaseModel):
    first_name: str
    last_name: str
    hebrew_name: str = ""
    father_name: str = ""
    mother_name: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    is_kohen: bool = False
    is_levi: bool = False
    member_type: str = "regular"
    notes: str = ""
    join_date: str = ""
    azkara_father: str = ""
    azkara_father_hebrew_day: int = 0
    azkara_father_hebrew_month: int = 0
    azkara_mother: str = ""
    azkara_mother_hebrew_day: int = 0
    azkara_mother_hebrew_month: int = 0
    birth_date: str = ""
    birth_date_hebrew_day: int = 0
    birth_date_hebrew_month: int = 0
    bar_mitzvah_shabbat: str = ""
    gender: str = "male"


class CongregantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    hebrew_name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_kohen: Optional[bool] = None
    is_levi: Optional[bool] = None
    member_type: Optional[str] = None
    notes: Optional[str] = None
    gender: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper – import-time date parsing
# ---------------------------------------------------------------------------

def _parse_date_iso(date_str: str) -> str:
    s = date_str.strip()
    if not s:
        return ""
    m = re.match(r"^(\d{1,2})[./](\d{1,2})[./](\d{4})$", s)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d):02d}"
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return s
    return ""


# ---------------------------------------------------------------------------
# CRUD endpoints
# ---------------------------------------------------------------------------

@router.post("/congregants", response_model=APIResponse, status_code=201)
async def create_congregant(
    req: CongregantCreate,
    actor: User = Depends(require_operational),
):
    """Register a new congregant. Optionally creates linked Azkara/Simcha records."""
    try:
        data = await congregant_service.add_congregant(
            first_name=req.first_name,
            last_name=req.last_name,
            hebrew_name=req.hebrew_name,
            father_name=req.father_name,
            mother_name=req.mother_name,
            phone=req.phone,
            email=req.email,
            address=req.address,
            is_kohen=req.is_kohen,
            is_levi=req.is_levi,
            member_type=req.member_type,
            notes=req.notes,
            join_date=req.join_date,
            actor=actor,
        )
        cid = data["id"]

        # Lazy imports to avoid circular module dependencies
        from app.modules.azkarot.service import azkara_service
        from app.modules.smachot.service import simcha_service

        if req.azkara_father:
            iso = _parse_date_iso(req.azkara_father)
            if iso:
                await azkara_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=req.father_name or "אבא",
                    relation="father",
                    gregorian_date=iso,
                    actor=actor,
                )
        elif req.azkara_father_hebrew_day and req.azkara_father_hebrew_month:
            await azkara_service.add_azkara(
                congregant_id=cid,
                deceased_name=req.father_name or "אבא",
                relation="father",
                hebrew_day=req.azkara_father_hebrew_day,
                hebrew_month=req.azkara_father_hebrew_month,
                actor=actor,
            )

        if req.azkara_mother:
            iso = _parse_date_iso(req.azkara_mother)
            if iso:
                await azkara_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=req.mother_name or "אמא",
                    relation="mother",
                    gregorian_date=iso,
                    actor=actor,
                )
        elif req.azkara_mother_hebrew_day and req.azkara_mother_hebrew_month:
            await azkara_service.add_azkara(
                congregant_id=cid,
                deceased_name=req.mother_name or "אמא",
                relation="mother",
                hebrew_day=req.azkara_mother_hebrew_day,
                hebrew_month=req.azkara_mother_hebrew_month,
                actor=actor,
            )

        if req.birth_date:
            iso = _parse_date_iso(req.birth_date)
            if iso:
                await simcha_service.add_simcha(
                    congregant_id=cid,
                    occasion_type="birthday",
                    gregorian_date=iso,
                    actor=actor,
                )
        elif req.birth_date_hebrew_day and req.birth_date_hebrew_month:
            await simcha_service.add_simcha(
                congregant_id=cid,
                occasion_type="birthday",
                hebrew_day=req.birth_date_hebrew_day,
                hebrew_month=req.birth_date_hebrew_month,
                actor=actor,
            )

        return APIResponse(message="Congregant created successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants", response_model=APIResponse)
async def list_congregants(
    member_type: Optional[str] = Query(None),
    archived: bool = Query(False),
):
    try:
        data = await congregant_service.list_congregants(
            member_type=member_type, archived=archived
        )
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk-delete", response_model=APIResponse)
async def bulk_delete_congregants(
    req: BulkIdsRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = await congregant_service.bulk_delete_congregants(req.ids, actor=actor)
        return APIResponse(message=f"{data['deleted']} מתפללים נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk-archive", response_model=APIResponse)
async def bulk_archive_congregants(
    req: BulkIdsRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = await congregant_service.bulk_archive_congregants(req.ids, actor=actor)
        return APIResponse(message=f"{data['archived']} מתפללים הועברו לארכיב.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk-restore", response_model=APIResponse)
async def bulk_restore_congregants(
    req: BulkIdsRequest,
    actor: User = Depends(require_operational),
):
    try:
        data = await congregant_service.bulk_restore_congregants(req.ids, actor=actor)
        return APIResponse(message=f"{data['restored']} מתפללים שוחזרו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants/{congregant_id}", response_model=APIResponse)
async def get_congregant(congregant_id: str):
    try:
        data = await congregant_service.get_congregant(congregant_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Congregant '{congregant_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/congregants/{congregant_id}", response_model=APIResponse)
async def update_congregant(
    congregant_id: str,
    req: CongregantUpdate,
    actor: User = Depends(require_operational),
):
    try:
        updates = req.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields provided for update.")
        data = await congregant_service.update_congregant(
            congregant_id,
            updates,
            actor=actor,
        )
        if data is None:
            raise HTTPException(status_code=404, detail=f"Congregant '{congregant_id}' not found.")
        return APIResponse(message="Congregant updated successfully.", data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# CSV / Google Sheets bulk import
# ---------------------------------------------------------------------------

COLUMN_ALIASES: dict[str, str] = {
    "שם פרטי": "first_name",
    "שם משפחה": "last_name",
    "שם בעברית": "hebrew_name",
    "שם האב": "father_name",
    "שם אבא": "father_name",
    "שם אמא": "mother_name",
    "טלפון": "phone",
    "אימייל": "email",
    "כתובת": "address",
    "כהן": "is_kohen",
    "לוי": "is_levi",
    "כהן/לוי/ישראל": "cohen_levi_israel",
    "סוג חברות": "member_type",
    "הערות": "notes",
    "תאריך הצטרפות": "join_date",
    "אזכרה אבא": "azkara_father",
    "אזכרה אמא": "azkara_mother",
    "תאריך לידה": "birth_date",
    "שבת בר מצווה": "bar_mitzvah_shabbat",
}

_CONGREGANT_FIELDS = (
    "first_name", "last_name", "hebrew_name", "father_name", "mother_name",
    "phone", "email", "address", "member_type", "notes", "join_date",
)
_EXTRA_FIELDS = ("azkara_father", "azkara_mother", "birth_date", "bar_mitzvah_shabbat")


def _normalise_row(row: dict) -> dict:
    normalised: dict = {}
    for raw_key, value in row.items():
        key = raw_key.strip()
        key_lower = key.lower().replace(" ", "_")
        field = COLUMN_ALIASES.get(key, key_lower)
        normalised[field] = value.strip() if isinstance(value, str) else value
    return normalised


def _coerce_congregant(raw: dict) -> tuple[dict, dict]:
    congregant: dict = {}
    for field in _CONGREGANT_FIELDS:
        congregant[field] = raw.get(field, "")

    cli = str(raw.get("cohen_levi_israel", "")).strip()
    if cli:
        congregant["is_kohen"] = "כהן" in cli
        congregant["is_levi"] = "לוי" in cli
    else:
        for bool_field in ("is_kohen", "is_levi"):
            val = str(raw.get(bool_field, "")).strip().lower()
            congregant[bool_field] = val in ("true", "1", "yes", "כן", "v", "✓")

    if not congregant["member_type"]:
        congregant["member_type"] = "regular"

    extra: dict = {}
    for field in _EXTRA_FIELDS:
        extra[field] = _parse_date_iso(str(raw.get(field, "")))

    return congregant, extra


async def _rows_from_csv(content: str) -> list[dict]:
    reader = csv.DictReader(io.StringIO(content))
    return [_normalise_row(row) for row in reader]


async def _import_rows(rows: list[dict], actor: User) -> tuple[list, list, list]:
    from app.modules.azkarot.service import azkara_service
    from app.modules.smachot.service import simcha_service

    created, skipped, errors = [], [], []
    for i, row in enumerate(rows, start=2):
        congregant_fields, extra = _coerce_congregant(row)
        if not congregant_fields["first_name"] or not congregant_fields["last_name"]:
            skipped.append({"row": i, "reason": "חסר שם פרטי או שם משפחה"})
            continue
        try:
            result = await congregant_service.add_congregant(
                **congregant_fields,
                actor=actor,
            )
            cid = result["id"]

            if extra["azkara_father"]:
                await azkara_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=congregant_fields.get("father_name") or "אבא",
                    relation="father",
                    gregorian_date=extra["azkara_father"],
                    actor=actor,
                )
            if extra["azkara_mother"]:
                await azkara_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=congregant_fields.get("mother_name") or "אמא",
                    relation="mother",
                    gregorian_date=extra["azkara_mother"],
                    actor=actor,
                )
            if extra["birth_date"]:
                await simcha_service.add_simcha(
                    congregant_id=cid,
                    occasion_type="birthday",
                    gregorian_date=extra["birth_date"],
                    actor=actor,
                )
            if extra["bar_mitzvah_shabbat"]:
                await simcha_service.add_simcha(
                    congregant_id=cid,
                    occasion_type="bar_mitzvah",
                    gregorian_date=extra["bar_mitzvah_shabbat"],
                    actor=actor,
                )
            created.append(result)
        except Exception as exc:
            errors.append({
                "row": i,
                "name": f"{congregant_fields['first_name']} {congregant_fields['last_name']}",
                "error": str(exc),
            })
    return created, skipped, errors


class BulkImportURL(BaseModel):
    url: str
    sheet_name: Optional[str] = None


@router.post("/congregants/bulk/csv", response_model=APIResponse, status_code=201)
async def bulk_import_csv(
    file: UploadFile = File(...),
    actor: User = Depends(require_operational),
):
    try:
        content = (await file.read()).decode("utf-8-sig")
        rows = await _rows_from_csv(content)
        if not rows:
            raise HTTPException(status_code=400, detail="הקובץ ריק או אינו תקין.")
        created, skipped, errors = await _import_rows(rows, actor)
        return APIResponse(
            message=f"ייבוא הושלם: {len(created)} נוצרו, {len(skipped)} דולגו, {len(errors)} שגיאות.",
            data={"created": len(created), "skipped": skipped, "errors": errors, "records": created},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk/sheets", response_model=APIResponse, status_code=201)
async def bulk_import_google_sheets(
    req: BulkImportURL,
    actor: User = Depends(require_operational),
):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            response = await client.get(req.url)
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"לא ניתן לגשת לגיליון: HTTP {response.status_code}",
            )
        rows = await _rows_from_csv(response.text)
        if not rows:
            raise HTTPException(status_code=400, detail="הגיליון ריק או אינו תקין.")
        created, skipped, errors = await _import_rows(rows, actor)
        return APIResponse(
            message=f"ייבוא מגיליון הושלם: {len(created)} נוצרו, {len(skipped)} דולגו, {len(errors)} שגיאות.",
            data={"created": len(created), "skipped": skipped, "errors": errors, "records": created},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
