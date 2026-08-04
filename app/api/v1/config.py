"""
Tenant configuration endpoint.

GET  /api/v1/config  – returns current TenantConfig + enabled module manifest
PATCH /api/v1/config – updates TenantConfig fields
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.db import get_session
from app.core.deps import require_admin
from app.core.registry import registry
from app.core.tenant import TenantConfig
from app.core.tenant_service import update_tenant_config
from app.models.base import APIResponse
from app.modules.auth.models import User

router = APIRouter(prefix="/config", tags=["config"])


class TenantConfigUpdate(BaseModel):
    synagogue_name: str | None = None
    logo_url: str | None = None
    color_primary: str | None = None
    color_secondary: str | None = None
    color_bg: str | None = None
    enabled_modules: list[str] | None = None


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
async def update_config(
    req: TenantConfigUpdate,
    actor: Annotated[User, Depends(require_admin)],
):
    """Update one or more tenant configuration fields."""
    try:
        updates = req.model_dump(exclude_none=True)
        config = update_tenant_config(actor, updates)
        return APIResponse(message="הגדרות עודכנו בהצלחה.", data=_config_response(config))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
