"""
Backward-compatibility shim.

Business logic now lives in individual module services under app/modules/.
This facade re-exports a SynagogueService that delegates to each module's service.
"""

from __future__ import annotations

from typing import Optional

from app.modules.congregants.service import congregant_service
from app.modules.payments.service import payment_service
from app.modules.aliyot.service import aliyot_service
from app.modules.seating.service import seating_service
from app.modules.azkarot.service import azkara_service
from app.modules.smachot.service import simcha_service
from app.modules.calendar.service import calendar_service


class SynagogueService:
    """Facade that delegates every call to the relevant module service."""

    async def get_info(self) -> dict:
        return {
            "name": "Gabay Synagogue",
            "operations": [
                "congregant_management", "payments", "aliyot_latora",
                "places", "azkarot", "smachot", "hebrew_calendar",
            ],
            "storage": "SQLite (gabay.db)",
        }

    # ── Congregants ──────────────────────────────────────────────────────
    async def add_congregant(self, **kwargs) -> dict:
        return await congregant_service.add_congregant(**kwargs)

    async def get_congregant(self, congregant_id: str) -> dict | None:
        return await congregant_service.get_congregant(congregant_id)

    async def find_congregant_by_name(self, name: str) -> dict | None:
        return await congregant_service.find_congregant_by_name(name)

    async def update_congregant(self, congregant_id: str, updates: dict) -> dict | None:
        return await congregant_service.update_congregant(congregant_id, updates)

    async def list_congregants(self, member_type=None, archived=False) -> dict:
        return await congregant_service.list_congregants(
            member_type=member_type, archived=archived
        )

    async def bulk_delete_congregants(self, ids: list[str]) -> dict:
        return await congregant_service.bulk_delete_congregants(ids)

    async def bulk_archive_congregants(self, ids: list[str]) -> dict:
        return await congregant_service.bulk_archive_congregants(ids)

    async def bulk_restore_congregants(self, ids: list[str]) -> dict:
        return await congregant_service.bulk_restore_congregants(ids)

    # ── Payments ─────────────────────────────────────────────────────────
    async def record_payment(self, **kwargs) -> dict:
        return await payment_service.record_payment(**kwargs)

    async def get_payment_history(self, congregant_id: str) -> dict:
        return await payment_service.get_payment_history(congregant_id)

    async def get_pending_payments(self) -> dict:
        return await payment_service.get_pending_payments()

    async def get_all_payments(self, purpose=None) -> dict:
        return await payment_service.get_all_payments(purpose=purpose)

    async def bulk_delete_payments(self, ids: list[str]) -> dict:
        return await payment_service.bulk_delete_payments(ids)

    # ── Aliyot ───────────────────────────────────────────────────────────
    async def assign_aliya(self, **kwargs) -> dict:
        return await aliyot_service.assign_aliya(**kwargs)

    async def list_aliyot(self) -> dict:
        return await aliyot_service.list_aliyot()

    async def bulk_delete_aliyot(self, ids: list[str]) -> dict:
        return await aliyot_service.bulk_delete_aliyot(ids)

    async def get_aliyot_for_parasha(self, parasha: str) -> dict:
        return await aliyot_service.get_aliyot_for_parasha(parasha)

    async def get_aliya_history(self, congregant_id: str) -> dict:
        return await aliyot_service.get_aliya_history(congregant_id)

    # ── Places ───────────────────────────────────────────────────────────
    async def add_place(self, **kwargs) -> dict:
        return await seating_service.add_place(**kwargs)

    async def assign_place(self, **kwargs) -> dict | None:
        return await seating_service.assign_place(**kwargs)

    async def unassign_place(self, place_id: str) -> dict | None:
        return await seating_service.unassign_place(place_id)

    async def get_place(self, place_id: str) -> dict | None:
        return await seating_service.get_place(place_id)

    async def list_places(self, section=None, only_free=False) -> dict:
        return await seating_service.list_places(
            section=section, only_free=only_free
        )

    async def get_congregant_place(self, congregant_id: str) -> dict | None:
        return await seating_service.get_congregant_place(congregant_id)

    async def bulk_delete_places(self, ids: list[str]) -> dict:
        return await seating_service.bulk_delete_places(ids)

    # ── Azkarot ───────────────────────────────────────────────────────────
    async def add_azkara(self, **kwargs) -> dict:
        return await azkara_service.add_azkara(**kwargs)

    async def get_azkara(self, azkara_id: str) -> dict | None:
        return await azkara_service.get_azkara(azkara_id)

    async def list_azkarot(self, congregant_id=None) -> dict:
        return await azkara_service.list_azkarot(congregant_id=congregant_id)

    async def get_upcoming_azkarot(self, days_ahead=30) -> dict:
        return await azkara_service.get_upcoming_azkarot(days_ahead=days_ahead)

    async def delete_azkara(self, azkara_id: str) -> bool:
        return await azkara_service.delete_azkara(azkara_id)

    async def bulk_delete_azkarot(self, ids: list[str]) -> dict:
        return await azkara_service.bulk_delete_azkarot(ids)

    # ── Smachot ───────────────────────────────────────────────────────────
    async def add_simcha(self, **kwargs) -> dict:
        return await simcha_service.add_simcha(**kwargs)

    async def get_simcha(self, simcha_id: str) -> dict | None:
        return await simcha_service.get_simcha(simcha_id)

    async def list_smachot(self, congregant_id=None, occasion_type=None) -> dict:
        return await simcha_service.list_smachot(
            congregant_id=congregant_id, occasion_type=occasion_type
        )

    async def get_upcoming_smachot(self, days_ahead=30, occasion_type=None) -> dict:
        return await simcha_service.get_upcoming_smachot(
            days_ahead=days_ahead, occasion_type=occasion_type
        )

    async def delete_simcha(self, simcha_id: str) -> bool:
        return await simcha_service.delete_simcha(simcha_id)

    async def bulk_delete_smachot(self, ids: list[str]) -> dict:
        return await simcha_service.bulk_delete_smachot(ids)

    # ── Calendar ─────────────────────────────────────────────────────────
    async def convert_gregorian_to_hebrew(self, date_str: str) -> dict:
        return await calendar_service.convert_gregorian_to_hebrew(date_str)

    async def convert_hebrew_to_gregorian(self, year: int, month: int, day: int) -> dict:
        return await calendar_service.convert_hebrew_to_gregorian(year, month, day)

    async def get_next_hebrew_occurrence(self, hebrew_month: int, hebrew_day: int, from_date_str="") -> dict:
        return await calendar_service.get_next_hebrew_occurrence(
            hebrew_month, hebrew_day, from_date_str
        )

    async def list_hebrew_months(self) -> dict:
        return await calendar_service.list_hebrew_months()

    async def get_calendar_month_view(self, year: int, month: int) -> dict:
        return await calendar_service.get_calendar_month_view(year, month)

    async def get_calendar_day_times(self, date_str: str) -> dict | None:
        return await calendar_service.get_calendar_day_times(date_str)


synagogue_service = SynagogueService()
