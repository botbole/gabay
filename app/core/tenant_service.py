"""Authorized tenant configuration operations."""

from __future__ import annotations

from app.core.authorization import require_service_admin
from app.core.db import get_session
from app.core.tenant import TenantConfig
from app.modules.auth.models import User


def update_tenant_config(actor: User, updates: dict) -> TenantConfig:
    require_service_admin(actor)
    with get_session() as session:
        config = session.get(TenantConfig, 1) or TenantConfig()
        for field, value in updates.items():
            if field == "enabled_modules":
                value = ",".join(value)
            setattr(config, field, value)
        session.add(config)
        session.commit()
        session.refresh(config)
        return config
