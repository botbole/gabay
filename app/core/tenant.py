"""
Tenant configuration – single-row settings table for the synagogue.

Stores display preferences (name, logo, colours) and which modules are
active. The frontend reads this via GET /api/v1/config and applies the
values as CSS custom properties and dynamic nav items.
"""

from __future__ import annotations

from sqlmodel import Field, SQLModel

ALL_MODULES = "congregants,payments,aliyot,seating,azkarot,smachot,calendar,llm,prayer_schedule,auth"


class TenantConfig(SQLModel, table=True):
    __tablename__ = "tenant_config"

    id: int = Field(default=1, primary_key=True)
    synagogue_name: str = "בית הכנסת"
    logo_url: str = ""
    color_primary: str = "#2E3A59"      # maps to --color-indigo
    color_secondary: str = "#C5A059"    # maps to --color-gold
    color_bg: str = "#F8FAFC"           # maps to --color-bg
    enabled_modules: str = ALL_MODULES  # comma-separated list of module IDs

    def get_enabled_modules_list(self) -> list[str]:
        return [m.strip() for m in self.enabled_modules.split(",") if m.strip()]
