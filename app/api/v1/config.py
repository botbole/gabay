"""
Tenant configuration endpoint.

GET  /api/v1/config  – returns current TenantConfig + enabled module manifest
PATCH /api/v1/config – updates TenantConfig fields
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.db import get_session
from app.core.registry import registry
from app.core.tenant import TenantConfig
from app.models.base import APIResponse

router = APIRouter(prefix="/config", tags=["config"])


class TenantConfigUpdate(BaseModel):
    synagogue_name: Optional[str] = None
    logo_url: Optional[str] = None
    color_primary: Optional[str] = None
    color_secondary: Optional[str] = None
    color_bg: Optional[str] = None
    enabled_modules: Optional[list[str]] = None


def _config_response(config: TenantConfig) -> dict:
    data = config.model_dump()
    enabled = config.get_enabled_modules_list()
    data["enabled_modules_list"] = enabled
    data["modules_manifest"] = registry.manifest(enabled)
    return data


@router.get("", response_model=APIResponse)
async def get_config():
    """Return current tenant configuration and enabled module manifest."""
    try:
        with get_session() as session:
            config = session.get(TenantConfig, 1)
            if not config:
                config = TenantConfig()
                session.add(config)
                session.commit()
                session.refresh(config)
        return APIResponse(data=_config_response(config))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("", response_model=APIResponse)
async def update_config(req: TenantConfigUpdate):
    """Update one or more tenant configuration fields."""
    try:
        with get_session() as session:
            config = session.get(TenantConfig, 1)
            if not config:
                config = TenantConfig()

            if req.synagogue_name is not None:
                config.synagogue_name = req.synagogue_name
            if req.logo_url is not None:
                config.logo_url = req.logo_url
            if req.color_primary is not None:
                config.color_primary = req.color_primary
            if req.color_secondary is not None:
                config.color_secondary = req.color_secondary
            if req.color_bg is not None:
                config.color_bg = req.color_bg
            if req.enabled_modules is not None:
                config.enabled_modules = ",".join(req.enabled_modules)

            session.add(config)
            session.commit()
            session.refresh(config)
        return APIResponse(message="הגדרות עודכנו בהצלחה.", data=_config_response(config))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
