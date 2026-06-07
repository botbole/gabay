"""
Synagogue business-logic layer.

Three domains are implemented with an in-memory store (no database yet):
  1. Congregant (Mispallel) management  – the people who pray here
  2. Payments & donations               – tracking money owed / received
  3. Aliya La-Torah                     – who gets called up each Shabbat/Yom-Tov

Data is stored in memory while the server is running.
It will be replaced with a real database in the next iteration.
"""

from __future__ import annotations
import uuid


class SynagogueService:
    def __init__(self) -> None:
        # In-memory stores – keyed by UUID string
        self._congregants: dict[str, dict] = {}
        self._payments: dict[str, list[dict]] = {}  # congregant_id -> list of payments
        self._aliyot: dict[str, list[dict]] = {}     # congregant_id -> list of aliyot


    # ------------------------------------------------------------------
    # Meta
    # ------------------------------------------------------------------

    async def get_info(self) -> dict:
        """Return basic information about the synagogue and supported operations."""
        return {
            "name": "Gabay Synagogue",
            "operations": [
                "congregant_management",
                "payments",
                "aliyot_latora",
            ],
            "note": "Operations are currently simulated; database integration is pending.",
        }

    # ------------------------------------------------------------------
    # 1.  Congregant (Mispallel) Management
    #     A "congregant" is the person who prays at the synagogue.
    # ------------------------------------------------------------------

    async def add_congregant(
        self,
        first_name: str,
        last_name: str,
        hebrew_name: str = "",
        phone: str = "",
        is_kohen: bool = False,
        is_levi: bool = False,
    ) -> dict:
        """Register a new congregant in the synagogue."""
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "first_name": first_name,
            "last_name": last_name,
            "hebrew_name": hebrew_name,
            "phone": phone,
            "is_kohen": is_kohen,
            "is_levi": is_levi,
        }
        self._congregants[new_id] = record
        return record

    async def get_congregant(self, congregant_id: str) -> dict | None:
        """Retrieve details of a specific congregant by their ID."""
        return self._congregants.get(congregant_id)

    async def update_congregant(self, congregant_id: str, updates: dict) -> dict | None:
        """Update information (phone, Hebrew name, etc.) for an existing congregant."""
        record = self._congregants.get(congregant_id)
        if record is None:
            return None
        record.update(updates)
        return record

    async def list_congregants(self) -> dict:
        """Return a list of all registered congregants."""
        congregants = list(self._congregants.values())
        return {
            "total": len(congregants),
            "congregants": congregants,
        }

    # ------------------------------------------------------------------
    # 2.  Payments & Donations
    # ------------------------------------------------------------------

    async def record_payment(
        self,
        congregant_id: str,
        amount: float,
        purpose: str,
        currency: str = "ILS",
    ) -> dict:
        """Record a payment or donation made by a congregant."""
        return {
            "status": "success",
            "message": (
                f"Recorded payment of {amount} {currency} "
                f"from congregant {congregant_id} for '{purpose}'."
            ),
            "data": {
                "congregant_id": congregant_id,
                "amount": amount,
                "currency": currency,
                "purpose": purpose,
            },
        }

    async def get_payment_history(self, congregant_id: str) -> dict:
        """Return the full payment history for a specific congregant (simulated)."""
        return {
            "congregant_id": congregant_id,
            "total_paid": 1200.0,
            "balance_due": 0.0,
            "payments": [
                {"date": "2026-04-10", "amount": 500.0, "purpose": "Membership fee"},
                {"date": "2026-05-15", "amount": 700.0, "purpose": "Aliya donation"},
            ],
        }

    async def get_pending_payments(self) -> dict:
        """Return a list of all congregants who have outstanding balances (simulated)."""
        return {
            "total_pending": 2,
            "congregants": [
                {"id": "3", "name": "David Mizrahi", "balance_due": 350.0},
                {"id": "4", "name": "Yosef Peretz", "balance_due": 200.0},
            ],
        }

    # ------------------------------------------------------------------
    # 3.  Aliya La-Torah
    #     Tracking who is called up to the Torah on each Shabbat / Yom-Tov
    # ------------------------------------------------------------------

    async def assign_aliya(
        self,
        congregant_id: str,
        parasha: str,
        aliya_type: str,
        date: str = "",
    ) -> dict:
        """
        Assign a specific Aliya to a congregant.

        aliya_type options: Kohen, Levi, Shlishi, Revi'i, Chamishi,
                            Shishi, Shvi'i, Maftir, Acharon
        """
        return {
            "status": "success",
            "message": (
                f"Assigned '{aliya_type}' for Parashat {parasha} "
                f"to congregant {congregant_id}."
            ),
            "data": {
                "congregant_id": congregant_id,
                "parasha": parasha,
                "aliya_type": aliya_type,
                "date": date,
            },
        }

    async def get_aliyot_for_parasha(self, parasha: str) -> dict:
        """Return all assigned Aliyot for a given Parasha (simulated)."""
        return {
            "parasha": parasha,
            "aliyot": [
                {"type": "Kohen",   "congregant_id": "1", "name": "Moshe Cohen"},
                {"type": "Levi",    "congregant_id": "2", "name": "Yitzchak Levi"},
                {"type": "Shlishi", "congregant_id": None, "name": "Unassigned"},
                {"type": "Revi'i",  "congregant_id": None, "name": "Unassigned"},
                {"type": "Chamishi","congregant_id": None, "name": "Unassigned"},
                {"type": "Shishi",  "congregant_id": None, "name": "Unassigned"},
                {"type": "Shvi'i",  "congregant_id": None, "name": "Unassigned"},
                {"type": "Maftir",  "congregant_id": None, "name": "Unassigned"},
            ],
        }

    async def get_aliya_history(self, congregant_id: str) -> dict:
        """Return the Aliya history for a specific congregant (simulated)."""
        return {
            "congregant_id": congregant_id,
            "total_aliyot": 3,
            "aliyot": [
                {"date": "2026-03-22", "parasha": "Vayikra",  "type": "Kohen"},
                {"date": "2026-04-05", "parasha": "Tzav",     "type": "Kohen"},
                {"date": "2026-05-10", "parasha": "Emor",     "type": "Maftir"},
            ],
        }


synagogue_service = SynagogueService()
