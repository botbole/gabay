"""
Synagogue operations router.

Sections
--------
GET  /synagogue/info
GET  /synagogue/health

POST   /synagogue/congregants
GET    /synagogue/congregants
GET    /synagogue/congregants/{id}
PATCH  /synagogue/congregants/{id}

POST  /synagogue/payments
GET   /synagogue/payments
GET   /synagogue/payments/pending
GET   /synagogue/payments/{congregant_id}/history

POST  /synagogue/aliyot
GET   /synagogue/aliyot/parasha/{parasha}
GET   /synagogue/aliyot/{congregant_id}/history

POST   /synagogue/places
GET    /synagogue/places
GET    /synagogue/places/{place_id}
PATCH  /synagogue/places/{place_id}/assign
PATCH  /synagogue/places/{place_id}/unassign
GET    /synagogue/congregants/{congregant_id}/place

POST    /synagogue/azkarot
GET     /synagogue/azkarot
GET     /synagogue/azkarot/upcoming
GET     /synagogue/azkarot/{azkara_id}
DELETE  /synagogue/azkarot/{azkara_id}

POST    /synagogue/smachot
GET     /synagogue/smachot
GET     /synagogue/smachot/upcoming
GET     /synagogue/smachot/{simcha_id}
DELETE  /synagogue/smachot/{simcha_id}

GET   /synagogue/calendar/gregorian-to-hebrew
GET   /synagogue/calendar/hebrew-to-gregorian
GET   /synagogue/calendar/next-occurrence
GET   /synagogue/calendar/months
"""

from __future__ import annotations

import csv
import io
from typing import Optional

import httpx
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

from app.models.base import APIResponse
from app.services.synagogue_service import synagogue_service

router = APIRouter(prefix="/synagogue", tags=["synagogue"])


# ===========================================================================
# Request schemas
# ===========================================================================

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
    member_type: str = "regular"   # regular | guest | occasional
    notes: str = ""
    join_date: str = ""
    # Optional fields that auto-create linked Azkara / Simcha records
    azkara_father: str = ""               # DD/MM/YYYY or YYYY-MM-DD → Azkara for father
    azkara_father_hebrew_day: int = 0     # Hebrew day (1-30) – used when no Gregorian date
    azkara_father_hebrew_month: int = 0   # Hebrew month (1-13)
    azkara_mother: str = ""               # DD/MM/YYYY or YYYY-MM-DD → Azkara for mother
    azkara_mother_hebrew_day: int = 0
    azkara_mother_hebrew_month: int = 0
    birth_date: str = ""                  # DD/MM/YYYY or YYYY-MM-DD → Simcha birthday
    birth_date_hebrew_day: int = 0
    birth_date_hebrew_month: int = 0
    bar_mitzvah_shabbat: str = ""         # Parasha/Shabbat name (text, not a date)
    gender: str = "male"                  # male | female


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


class PaymentCreate(BaseModel):
    congregant_id: str
    amount: float
    purpose: str        # e.g. aliya, kiddush, annual_dues, donation
    currency: str = "ILS"
    notes: str = ""
    payment_date: str = ""


class AliyaCreate(BaseModel):
    congregant_id: str
    parasha: str
    aliya_type: str     # Kohen, Levi, Shlishi, Revi'i, Chamishi, Shishi, Shvi'i, Maftir
    date_str: str = ""
    minhag: str = ""
    donation_amount: float = 0.0
    notes: str = ""


class PlaceCreate(BaseModel):
    section: str        # e.g. main, east, balcony, women
    row: str            # e.g. "A" or "3"
    place_number: int
    congregant_id: Optional[str] = None
    is_reserved: bool = False
    annual_fee: float = 0.0
    notes: str = ""


class PlaceAssign(BaseModel):
    congregant_id: str
    is_reserved: bool = True
    annual_fee: float = 0.0


class AzkaraCreate(BaseModel):
    congregant_id: str
    deceased_name: str
    deceased_hebrew_name: str = ""
    relation: str = ""              # father, mother, spouse, sibling, child, other
    gregorian_date: str = ""        # YYYY-MM-DD – auto-converts to Hebrew if provided
    hebrew_day: int = 0             # override / supply when Gregorian date unknown
    hebrew_month: int = 0
    year_occurred: Optional[int] = None   # Gregorian year of passing
    notes: str = ""


class SimchaCreate(BaseModel):
    congregant_id: str
    occasion_type: str              # birthday, anniversary, bar_mitzvah, bat_mitzvah, brit, upsherin, other
    description: str = ""
    gregorian_date: str = ""        # YYYY-MM-DD – auto-converts to Hebrew if provided
    hebrew_day: int = 0
    hebrew_month: int = 0
    parasha: str = ""               # for bar/bat mitzvah
    year_occurred: Optional[int] = None   # Gregorian year the event occurred
    notes: str = ""


# ===========================================================================
# General
# ===========================================================================

@router.get("/info", response_model=APIResponse)
async def get_synagogue_info():
    """General information about the synagogue system and supported operations."""
    data = await synagogue_service.get_info()
    return APIResponse(data=data)


# ===========================================================================
# Congregant (Mispallel) management
# ===========================================================================

@router.post("/congregants", response_model=APIResponse, status_code=201)
async def create_congregant(req: CongregantCreate):
    """Register a new congregant (regular, guest, or occasional).

    Optionally pass azkara_father / azkara_mother / birth_date / bar_mitzvah_shabbat
    (date in DD/MM/YYYY or YYYY-MM-DD) to auto-create linked Azkara / Simcha records.
    """
    try:
        data = await synagogue_service.add_congregant(
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
        )
        cid = data["id"]

        # Auto-create related records when date fields are provided
        if req.azkara_father:
            iso = _parse_date_iso(req.azkara_father)
            if iso:
                await synagogue_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=req.father_name or "אבא",
                    relation="father",
                    gregorian_date=iso,
                )
        elif req.azkara_father_hebrew_day and req.azkara_father_hebrew_month:
            await synagogue_service.add_azkara(
                congregant_id=cid,
                deceased_name=req.father_name or "אבא",
                relation="father",
                hebrew_day=req.azkara_father_hebrew_day,
                hebrew_month=req.azkara_father_hebrew_month,
            )

        if req.azkara_mother:
            iso = _parse_date_iso(req.azkara_mother)
            if iso:
                await synagogue_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=req.mother_name or "אמא",
                    relation="mother",
                    gregorian_date=iso,
                )
        elif req.azkara_mother_hebrew_day and req.azkara_mother_hebrew_month:
            await synagogue_service.add_azkara(
                congregant_id=cid,
                deceased_name=req.mother_name or "אמא",
                relation="mother",
                hebrew_day=req.azkara_mother_hebrew_day,
                hebrew_month=req.azkara_mother_hebrew_month,
            )

        if req.birth_date:
            iso = _parse_date_iso(req.birth_date)
            if iso:
                await synagogue_service.add_simcha(
                    congregant_id=cid,
                    occasion_type="birthday",
                    gregorian_date=iso,
                )
        elif req.birth_date_hebrew_day and req.birth_date_hebrew_month:
            await synagogue_service.add_simcha(
                congregant_id=cid,
                occasion_type="birthday",
                hebrew_day=req.birth_date_hebrew_day,
                hebrew_month=req.birth_date_hebrew_month,
            )

        # bar_mitzvah_shabbat is now a free-text parasha name, not a date

        return APIResponse(message="Congregant created successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants", response_model=APIResponse)
async def list_congregants(
    member_type: Optional[str] = Query(None, description="Filter: regular | guest | occasional"),
    archived: bool = Query(False, description="Return archived congregants instead of active ones"),
):
    """Return the list of all registered congregants."""
    try:
        data = await synagogue_service.list_congregants(member_type=member_type, archived=archived)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk-delete", response_model=APIResponse)
async def bulk_delete_congregants(req: BulkIdsRequest):
    """Permanently delete multiple congregants."""
    try:
        data = await synagogue_service.bulk_delete_congregants(req.ids)
        return APIResponse(message=f"{data['deleted']} מתפללים נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk-archive", response_model=APIResponse)
async def bulk_archive_congregants(req: BulkIdsRequest):
    """Move multiple congregants to the archive."""
    try:
        data = await synagogue_service.bulk_archive_congregants(req.ids)
        return APIResponse(message=f"{data['archived']} מתפללים הועברו לארכיב.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk-restore", response_model=APIResponse)
async def bulk_restore_congregants(req: BulkIdsRequest):
    """Restore multiple congregants from the archive."""
    try:
        data = await synagogue_service.bulk_restore_congregants(req.ids)
        return APIResponse(message=f"{data['restored']} מתפללים שוחזרו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants/{congregant_id}", response_model=APIResponse)
async def get_congregant(congregant_id: str):
    """Return details of a specific congregant."""
    try:
        data = await synagogue_service.get_congregant(congregant_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Congregant '{congregant_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/congregants/{congregant_id}", response_model=APIResponse)
async def update_congregant(congregant_id: str, req: CongregantUpdate):
    """Update one or more fields of an existing congregant."""
    try:
        updates = req.model_dump(exclude_none=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields provided for update.")
        data = await synagogue_service.update_congregant(congregant_id, updates)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Congregant '{congregant_id}' not found.")
        return APIResponse(message="Congregant updated successfully.", data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants/{congregant_id}/place", response_model=APIResponse)
async def get_congregant_place(congregant_id: str):
    """Return the seat assigned to a specific congregant."""
    try:
        data = await synagogue_service.get_congregant_place(congregant_id)
        if data is None:
            raise HTTPException(status_code=404, detail="No seat assigned to this congregant.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Payments & Donations
# ===========================================================================

@router.post("/payments", response_model=APIResponse, status_code=201)
async def record_payment(req: PaymentCreate):
    """Record a payment or donation for a congregant."""
    try:
        data = await synagogue_service.record_payment(
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
    purpose: Optional[str] = Query(None, description="Filter by purpose (aliya, kiddush, donation …)"),
):
    """Return all payment records."""
    try:
        data = await synagogue_service.get_all_payments(purpose=purpose)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/payments/bulk-delete", response_model=APIResponse)
async def bulk_delete_payments(req: BulkIdsRequest):
    """Permanently delete multiple payment records."""
    try:
        data = await synagogue_service.bulk_delete_payments(req.ids)
        return APIResponse(message=f"{data['deleted']} תשלומים נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/payments/pending", response_model=APIResponse)
async def get_pending_payments():
    """Return congregants with no recorded payments."""
    try:
        data = await synagogue_service.get_pending_payments()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/payments/{congregant_id}/history", response_model=APIResponse)
async def get_payment_history(congregant_id: str):
    """Return full payment history for a congregant."""
    try:
        data = await synagogue_service.get_payment_history(congregant_id)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Aliya La-Torah
# ===========================================================================

@router.post("/aliyot", response_model=APIResponse, status_code=201)
async def assign_aliya(req: AliyaCreate):
    """
    Assign an aliya to a congregant.
    If donation_amount > 0 a payment is automatically recorded.
    """
    try:
        data = await synagogue_service.assign_aliya(
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
    """Return all aliyot records."""
    try:
        data = await synagogue_service.list_aliyot()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/aliyot/parasha/{parasha}", response_model=APIResponse)
async def get_aliyot_for_parasha(parasha: str):
    """Return all aliyot assigned for a specific Parasha."""
    try:
        data = await synagogue_service.get_aliyot_for_parasha(parasha)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/aliyot/{congregant_id}/history", response_model=APIResponse)
async def get_aliya_history(congregant_id: str):
    """Return the full aliya history for a congregant."""
    try:
        data = await synagogue_service.get_aliya_history(congregant_id)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/aliyot/bulk-delete", response_model=APIResponse)
async def bulk_delete_aliyot(req: BulkIdsRequest):
    """Permanently delete multiple aliya records."""
    try:
        data = await synagogue_service.bulk_delete_aliyot(req.ids)
        return APIResponse(message=f"{data['deleted']} עליות נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Places (sanctuary seating)
# ===========================================================================

@router.post("/places", response_model=APIResponse, status_code=201)
async def add_place(req: PlaceCreate):
    """Add a seat to the sanctuary seating map."""
    try:
        data = await synagogue_service.add_place(
            section=req.section,
            row=req.row,
            place_number=req.place_number,
            congregant_id=req.congregant_id,
            is_reserved=req.is_reserved,
            annual_fee=req.annual_fee,
            notes=req.notes,
        )
        return APIResponse(message="Place added successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/places", response_model=APIResponse)
async def list_places(
    section: Optional[str] = Query(None, description="Filter by section (main, east, balcony, women …)"),
    only_free: bool = Query(False, description="Return only unassigned seats"),
):
    """Return all seats, optionally filtered."""
    try:
        data = await synagogue_service.list_places(section=section, only_free=only_free)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/places/{place_id}", response_model=APIResponse)
async def get_place(place_id: str):
    """Return details of a specific seat."""
    try:
        data = await synagogue_service.get_place(place_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/places/{place_id}/assign", response_model=APIResponse)
async def assign_place(place_id: str, req: PlaceAssign):
    """Assign a seat to a congregant."""
    try:
        data = await synagogue_service.assign_place(
            place_id=place_id,
            congregant_id=req.congregant_id,
            is_reserved=req.is_reserved,
            annual_fee=req.annual_fee,
        )
        if data is None:
            raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found.")
        return APIResponse(message="Place assigned successfully.", data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/places/{place_id}/unassign", response_model=APIResponse)
async def unassign_place(place_id: str):
    """Remove the congregant assignment from a seat."""
    try:
        data = await synagogue_service.unassign_place(place_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Place '{place_id}' not found.")
        return APIResponse(message="Place unassigned.", data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/places/bulk-delete", response_model=APIResponse)
async def bulk_delete_places(req: BulkIdsRequest):
    """Permanently delete multiple seat records."""
    try:
        data = await synagogue_service.bulk_delete_places(req.ids)
        return APIResponse(message=f"{data['deleted']} מושבים נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Azkarot (yahrzeit / memorial)
# ===========================================================================

@router.post("/azkarot", response_model=APIResponse, status_code=201)
async def add_azkara(req: AzkaraCreate):
    """
    Add a yahrzeit record.
    Supply gregorian_date (YYYY-MM-DD) and the Hebrew date is auto-calculated.
    Alternatively supply hebrew_day + hebrew_month directly.
    """
    try:
        data = await synagogue_service.add_azkara(
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
    days_ahead: int = Query(30, description="Look-ahead window in days"),
):
    """Return yahrzeit records whose Hebrew anniversary falls within the next N days."""
    try:
        data = await synagogue_service.get_upcoming_azkarot(days_ahead=days_ahead)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/azkarot", response_model=APIResponse)
async def list_azkarot(
    congregant_id: Optional[str] = Query(None, description="Filter by congregant"),
):
    """Return all yahrzeit records."""
    try:
        data = await synagogue_service.list_azkarot(congregant_id=congregant_id)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/azkarot/{azkara_id}", response_model=APIResponse)
async def get_azkara(azkara_id: str):
    """Return a specific yahrzeit record."""
    try:
        data = await synagogue_service.get_azkara(azkara_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Azkara '{azkara_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/azkarot/{azkara_id}", response_model=APIResponse)
async def delete_azkara(azkara_id: str):
    """Delete a yahrzeit record."""
    try:
        deleted = await synagogue_service.delete_azkara(azkara_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Azkara '{azkara_id}' not found.")
        return APIResponse(message="Azkara deleted.", data={"id": azkara_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/azkarot/bulk-delete", response_model=APIResponse)
async def bulk_delete_azkarot(req: BulkIdsRequest):
    """Permanently delete multiple azkara records."""
    try:
        data = await synagogue_service.bulk_delete_azkarot(req.ids)
        return APIResponse(message=f"{data['deleted']} אזכרות נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Smachot (lifecycle celebrations)
# ===========================================================================

@router.post("/smachot", response_model=APIResponse, status_code=201)
async def add_simcha(req: SimchaCreate):
    """
    Add a simcha record (birthday, anniversary, bar/bat mitzvah …).
    Supply gregorian_date (YYYY-MM-DD) and the Hebrew date is auto-calculated.
    Alternatively supply hebrew_day + hebrew_month directly.
    """
    try:
        data = await synagogue_service.add_simcha(
            congregant_id=req.congregant_id,
            occasion_type=req.occasion_type,
            description=req.description,
            gregorian_date=req.gregorian_date,
            hebrew_day=req.hebrew_day,
            hebrew_month=req.hebrew_month,
            parasha=req.parasha,
            year_occurred=req.year_occurred,
            notes=req.notes,
        )
        return APIResponse(message="Simcha added successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/smachot/upcoming", response_model=APIResponse)
async def get_upcoming_smachot(
    days_ahead: int = Query(30, description="Look-ahead window in days"),
    occasion_type: Optional[str] = Query(None, description="Filter by occasion type"),
):
    """Return smachot whose Hebrew anniversary falls within the next N days."""
    try:
        data = await synagogue_service.get_upcoming_smachot(
            days_ahead=days_ahead, occasion_type=occasion_type
        )
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/smachot", response_model=APIResponse)
async def list_smachot(
    congregant_id: Optional[str] = Query(None, description="Filter by congregant"),
    occasion_type: Optional[str] = Query(None, description="Filter by type"),
):
    """Return all smachot records."""
    try:
        data = await synagogue_service.list_smachot(
            congregant_id=congregant_id, occasion_type=occasion_type
        )
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/smachot/{simcha_id}", response_model=APIResponse)
async def get_simcha(simcha_id: str):
    """Return a specific simcha record."""
    try:
        data = await synagogue_service.get_simcha(simcha_id)
        if data is None:
            raise HTTPException(status_code=404, detail=f"Simcha '{simcha_id}' not found.")
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/smachot/{simcha_id}", response_model=APIResponse)
async def delete_simcha(simcha_id: str):
    """Delete a simcha record."""
    try:
        deleted = await synagogue_service.delete_simcha(simcha_id)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Simcha '{simcha_id}' not found.")
        return APIResponse(message="Simcha deleted.", data={"id": simcha_id})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/smachot/bulk-delete", response_model=APIResponse)
async def bulk_delete_smachot(req: BulkIdsRequest):
    """Permanently delete multiple simcha records."""
    try:
        data = await synagogue_service.bulk_delete_smachot(req.ids)
        return APIResponse(message=f"{data['deleted']} שמחות נמחקו.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Hebrew ↔ Gregorian calendar utilities
# ===========================================================================

@router.get("/calendar/gregorian-to-hebrew", response_model=APIResponse)
async def gregorian_to_hebrew(
    date: str = Query(..., description="Gregorian date in YYYY-MM-DD format"),
):
    """Convert a Gregorian date to its Hebrew equivalent."""
    try:
        data = await synagogue_service.convert_gregorian_to_hebrew(date)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/hebrew-to-gregorian", response_model=APIResponse)
async def hebrew_to_gregorian(
    year: int = Query(..., description="Hebrew year, e.g. 5786"),
    month: int = Query(..., description="Hebrew month number (pyluach: Nisan=1 … Elul=6, Tishrei=7 … Adar=12, Adar II=13)"),
    day: int = Query(..., description="Hebrew day of month"),
):
    """Convert a Hebrew date to its Gregorian equivalent."""
    try:
        data = await synagogue_service.convert_hebrew_to_gregorian(year, month, day)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/next-occurrence", response_model=APIResponse)
async def next_hebrew_occurrence(
    month: int = Query(..., description="Hebrew month number"),
    day: int = Query(..., description="Hebrew day"),
    from_date: str = Query("", description="Start from this Gregorian date (YYYY-MM-DD). Defaults to today."),
):
    """
    Return the next Gregorian date on which a recurring Hebrew calendar date falls.
    Useful for quickly finding when the next birthday / yahrzeit will occur.
    """
    try:
        data = await synagogue_service.get_next_hebrew_occurrence(month, day, from_date)
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/months", response_model=APIResponse)
async def list_hebrew_months():
    """Return a reference list of all Hebrew months with their names."""
    try:
        data = await synagogue_service.list_hebrew_months()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/calendar/month-view", response_model=APIResponse)
async def get_calendar_month_view(
    year: int = Query(..., description="Hebrew year, e.g. 5786"),
    month: int = Query(..., description="Hebrew month number (Tishrei=7 … Elul=6)"),
):
    """
    Return a full month-view for a Hebrew month.

    The response includes:
    - Month metadata (name, leap year flag, prev/next month pointers)
    - A ``days`` list where each entry has: Gregorian date, day-of-week,
      Shabbat flag, holiday name (Hebrew + English), and all azkarot / smachot
      events whose Hebrew anniversary falls on that day.
    """
    try:
        data = await synagogue_service.get_calendar_month_view(year, month)
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])
        return APIResponse(data=data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ===========================================================================
# Bulk import – congregants
# ===========================================================================

# Supported CSV columns (Hebrew or English, case-insensitive, order-independent):
#
# Congregant core fields:
#   שם פרטי / first_name         – required
#   שם משפחה / last_name         – required
#   שם בעברית / hebrew_name      – optional
#   שם אבא / שם האב / father_name
#   שם אמא / mother_name
#   טלפון / phone
#   אימייל / email
#   כתובת / address
#   כהן/לוי/ישראל               – "כהן" | "לוי" | "ישראל" (sets is_kohen / is_levi)
#   כהן / is_kohen               – true/כן/1/v/✓
#   לוי / is_levi                – true/כן/1/v/✓
#   סוג חברות / member_type      – regular | guest | occasional
#   הערות / notes
#   תאריך הצטרפות / join_date
#
# Generates related records automatically:
#   אזכרה אבא  – date (DD/MM/YYYY or YYYY-MM-DD) → Azkara record for father
#   אזכרה אמא  – date (DD/MM/YYYY or YYYY-MM-DD) → Azkara record for mother
#   תאריך לידה – date → Simcha "birthday" record
#   שבת בר מצווה – date → Simcha "bar_mitzvah" record

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

# Congregant fields passed to add_congregant()
_CONGREGANT_FIELDS = (
    "first_name", "last_name", "hebrew_name", "father_name", "mother_name",
    "phone", "email", "address", "member_type", "notes", "join_date",
)
# Extra import-only fields that generate related records
_EXTRA_FIELDS = ("azkara_father", "azkara_mother", "birth_date", "bar_mitzvah_shabbat")


def _normalise_row(row: dict) -> dict:
    """Normalise CSV row keys to internal field names, ignoring unknown columns."""
    normalised: dict = {}
    for raw_key, value in row.items():
        key = raw_key.strip()
        key_lower = key.lower().replace(" ", "_")
        field = COLUMN_ALIASES.get(key, key_lower)
        normalised[field] = value.strip() if isinstance(value, str) else value
    return normalised


def _parse_date_iso(date_str: str) -> str:
    """
    Normalise a date string to ISO YYYY-MM-DD.
    Handles DD/MM/YYYY, DD.MM.YYYY, and YYYY-MM-DD.
    Returns empty string on failure.
    """
    import re
    s = date_str.strip()
    if not s:
        return ""
    # DD/MM/YYYY or DD.MM.YYYY
    m = re.match(r"^(\d{1,2})[./](\d{1,2})[./](\d{4})$", s)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{int(mo):02d}-{int(d):02d}"
    # YYYY-MM-DD already
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return s
    return ""


def _coerce_congregant(raw: dict) -> tuple[dict, dict]:
    """
    Split a normalised CSV row into:
    - congregant_fields dict (passed directly to add_congregant)
    - extra_fields dict (azkara/simcha dates to create afterwards)
    """
    congregant: dict = {}
    for field in _CONGREGANT_FIELDS:
        congregant[field] = raw.get(field, "")

    # Handle כהן/לוי/ישראל combined column
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


async def _import_rows(rows: list[dict]) -> tuple[list, list, list]:
    """
    Process normalised CSV rows: create congregants + related Azkara / Simcha records.
    Returns (created, skipped, errors).
    """
    created, skipped, errors = [], [], []
    for i, row in enumerate(rows, start=2):
        congregant_fields, extra = _coerce_congregant(row)
        if not congregant_fields["first_name"] or not congregant_fields["last_name"]:
            skipped.append({"row": i, "reason": "חסר שם פרטי או שם משפחה"})
            continue
        try:
            result = await synagogue_service.add_congregant(**congregant_fields)
            cid = result["id"]

            # Azkara for father
            if extra["azkara_father"]:
                father = congregant_fields.get("father_name") or "אבא"
                await synagogue_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=father,
                    relation="father",
                    gregorian_date=extra["azkara_father"],
                )

            # Azkara for mother
            if extra["azkara_mother"]:
                mother = congregant_fields.get("mother_name") or "אמא"
                await synagogue_service.add_azkara(
                    congregant_id=cid,
                    deceased_name=mother,
                    relation="mother",
                    gregorian_date=extra["azkara_mother"],
                )

            # Birthday simcha
            if extra["birth_date"]:
                await synagogue_service.add_simcha(
                    congregant_id=cid,
                    occasion_type="birthday",
                    gregorian_date=extra["birth_date"],
                )

            # Bar Mitzvah simcha
            if extra["bar_mitzvah_shabbat"]:
                await synagogue_service.add_simcha(
                    congregant_id=cid,
                    occasion_type="bar_mitzvah",
                    gregorian_date=extra["bar_mitzvah_shabbat"],
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
async def bulk_import_csv(file: UploadFile = File(...)):
    """
    Import multiple congregants from an uploaded CSV file.

    The first row must be a header with column names.
    Supports both English and Hebrew column headers (see COLUMN_ALIASES above).
    Extra columns (אזכרה אבא, אזכרה אמא, תאריך לידה, שבת בר מצווה) automatically
    create linked Azkara / Simcha records.
    Returns a summary of created / skipped records.
    """
    try:
        content = (await file.read()).decode("utf-8-sig")  # utf-8-sig handles Excel BOM
        rows = await _rows_from_csv(content)
        if not rows:
            raise HTTPException(status_code=400, detail="הקובץ ריק או אינו תקין.")

        created, skipped, errors = await _import_rows(rows)
        return APIResponse(
            message=f"ייבוא הושלם: {len(created)} נוצרו, {len(skipped)} דולגו, {len(errors)} שגיאות.",
            data={"created": len(created), "skipped": skipped, "errors": errors, "records": created},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/congregants/bulk/sheets", response_model=APIResponse, status_code=201)
async def bulk_import_google_sheets(req: BulkImportURL):
    """
    Import congregants from a published Google Sheet.

    Steps to get the URL:
    1. Open your Google Sheet.
    2. File → Share → Publish to web.
    3. Choose the sheet tab and select \"Comma-separated values (.csv)\".
    4. Click Publish and copy the link.
    5. Paste that link here.

    The sheet must have a header row with Hebrew or English column names.
    Extra columns (אזכרה אבא, אזכרה אמא, תאריך לידה, שבת בר מצווה) automatically
    create linked Azkara / Simcha records.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            response = await client.get(req.url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"לא ניתן לגשת לגיליון: HTTP {response.status_code}")

        content = response.text
        rows = await _rows_from_csv(content)
        if not rows:
            raise HTTPException(status_code=400, detail="הגיליון ריק או אינו תקין.")

        created, skipped, errors = await _import_rows(rows)
        return APIResponse(
            message=f"ייבוא מגיליון הושלם: {len(created)} נוצרו, {len(skipped)} דולגו, {len(errors)} שגיאות.",
            data={"created": len(created), "skipped": skipped, "errors": errors, "records": created},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
