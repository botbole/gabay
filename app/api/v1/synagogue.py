"""
Synagogue operations router.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.base import APIResponse
from app.services.synagogue_service import synagogue_service

router = APIRouter(prefix="/synagogue", tags=["synagogue"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CongregantCreate(BaseModel):
    first_name: str
    last_name: str
    hebrew_name: str = ""
    phone: str = ""
    is_kohen: bool = False
    is_levi: bool = False


class CongregantUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    hebrew_name: str | None = None
    phone: str | None = None
    is_kohen: bool | None = None
    is_levi: bool | None = None


# ---------------------------------------------------------------------------
# General
# ---------------------------------------------------------------------------

@router.get("/info", response_model=APIResponse)
async def get_synagogue_info():
    """Return general information about the synagogue and supported operations."""
    data = await synagogue_service.get_info()
    return APIResponse(data=data)


# ---------------------------------------------------------------------------
# Congregant (Mispallel / Prayer) management
# ---------------------------------------------------------------------------

@router.post("/congregants", response_model=APIResponse, status_code=201)
async def create_congregant(request: CongregantCreate):
    """Register a new congregant in the synagogue."""
    try:
        data = await synagogue_service.add_congregant(
            first_name=request.first_name,
            last_name=request.last_name,
            hebrew_name=request.hebrew_name,
            phone=request.phone,
            is_kohen=request.is_kohen,
            is_levi=request.is_levi,
        )
        return APIResponse(message="Congregant created successfully.", data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants", response_model=APIResponse)
async def list_congregants():
    """Return the list of all registered congregants."""
    try:
        data = await synagogue_service.list_congregants()
        return APIResponse(data=data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/congregants/{congregant_id}", response_model=APIResponse)
async def get_congregant(congregant_id: str):
    """Return details of a specific congregant by their ID."""
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
async def update_congregant(congregant_id: str, request: CongregantUpdate):
    """Update one or more fields of an existing congregant."""
    try:
        updates = request.model_dump(exclude_none=True)
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
