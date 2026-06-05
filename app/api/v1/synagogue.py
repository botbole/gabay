"""
Synagogue operations router.
Endpoints here are stubs – concrete implementations come as features are defined.
"""

from fastapi import APIRouter

from app.models.base import APIResponse
from app.services.synagogue_service import synagogue_service

router = APIRouter(prefix="/synagogue", tags=["synagogue"])


@router.get("/info", response_model=APIResponse)
async def get_synagogue_info():
    """Return general information about the synagogue and supported operations."""
    data = await synagogue_service.get_info()
    return APIResponse(data=data)
