"""
Synagogue business-logic layer – backed by a real SQLite database.

All data is persisted to gabay.db.

Sections
--------
1.  Congregant (Mispallel) Management
2.  Payments & Donations
3.  Aliya La-Torah
4.  Places (sanctuary seating)
5.  Azkarot (yahrzeit / memorial)
6.  Smachot (lifecycle celebrations)
7.  Hebrew ↔ Gregorian calendar utilities
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from sqlmodel import select

from app.core.db import get_session
from app.core.hebrew_date import (
    gregorian_to_hebrew,
    hebrew_to_gregorian,
    hebrew_month_list,
    get_next_occurrence,
    parse_gregorian_iso,
    upcoming_occurrences,
)
from app.models.db_models import (
    Aliya,
    Azkara,
    Congregant,
    Payment,
    Place,
    Simcha,
)


class SynagogueService:

    # ------------------------------------------------------------------
    # Meta
    # ------------------------------------------------------------------

    async def get_info(self) -> dict:
        return {
            "name": "Gabay Synagogue",
            "operations": [
                "congregant_management",
                "payments",
                "aliyot_latora",
                "places",
                "azkarot",
                "smachot",
                "hebrew_calendar",
            ],
            "storage": "SQLite (gabay.db)",
        }

    # ------------------------------------------------------------------
    # 1.  Congregant (Mispallel) Management
    # ------------------------------------------------------------------

    async def add_congregant(
        self,
        first_name: str,
        last_name: str,
        hebrew_name: str = "",
        father_name: str = "",
        phone: str = "",
        email: str = "",
        address: str = "",
        is_kohen: bool = False,
        is_levi: bool = False,
        member_type: str = "regular",
        notes: str = "",
        join_date: str = "",
    ) -> dict:
        """Register a new congregant and persist to the database."""
        congregant = Congregant(
            first_name=first_name,
            last_name=last_name,
            hebrew_name=hebrew_name,
            father_name=father_name,
            phone=phone,
            email=email,
            address=address,
            is_kohen=is_kohen,
            is_levi=is_levi,
            member_type=member_type,
            notes=notes,
            join_date=join_date or date.today().isoformat(),
        )
        with get_session() as session:
            session.add(congregant)
            session.commit()
            session.refresh(congregant)
            return congregant.model_dump()

    async def get_congregant(self, congregant_id: str) -> dict | None:
        """Retrieve a congregant by ID."""
        with get_session() as session:
            congregant = session.get(Congregant, congregant_id)
            return congregant.model_dump() if congregant else None

    async def update_congregant(self, congregant_id: str, updates: dict) -> dict | None:
        """Update specific fields of an existing congregant."""
        with get_session() as session:
            congregant = session.get(Congregant, congregant_id)
            if not congregant:
                return None
            for field, value in updates.items():
                setattr(congregant, field, value)
            session.add(congregant)
            session.commit()
            session.refresh(congregant)
            return congregant.model_dump()

    async def list_congregants(self, member_type: Optional[str] = None) -> dict:
        """Return all registered congregants, optionally filtered by member_type."""
        with get_session() as session:
            stmt = select(Congregant)
            if member_type:
                stmt = stmt.where(Congregant.member_type == member_type)
            congregants = session.exec(stmt).all()
            return {
                "total": len(congregants),
                "congregants": [c.model_dump() for c in congregants],
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
        notes: str = "",
        payment_date: str = "",
    ) -> dict:
        """Record a payment or donation for a congregant."""
        payment = Payment(
            congregant_id=congregant_id,
            amount=amount,
            purpose=purpose,
            currency=currency,
            notes=notes,
            date=payment_date or date.today().isoformat(),
        )
        with get_session() as session:
            session.add(payment)
            session.commit()
            session.refresh(payment)
            return payment.model_dump()

    async def get_payment_history(self, congregant_id: str) -> dict:
        """Return all payments for a specific congregant."""
        with get_session() as session:
            payments = session.exec(
                select(Payment).where(Payment.congregant_id == congregant_id)
            ).all()
            total_paid = sum(p.amount for p in payments)
            by_purpose: dict[str, float] = {}
            for p in payments:
                by_purpose[p.purpose] = by_purpose.get(p.purpose, 0.0) + p.amount
            return {
                "congregant_id": congregant_id,
                "total_paid": total_paid,
                "by_purpose": by_purpose,
                "payments": [p.model_dump() for p in payments],
            }

    async def get_pending_payments(self) -> dict:
        """Return all congregants who have no recorded payments."""
        with get_session() as session:
            congregants = session.exec(select(Congregant)).all()
            paid_ids = {
                p.congregant_id
                for p in session.exec(select(Payment)).all()
            }
            pending = [c for c in congregants if c.id not in paid_ids]
            return {
                "total_pending": len(pending),
                "congregants": [
                    {"id": c.id, "name": f"{c.first_name} {c.last_name}"}
                    for c in pending
                ],
            }

    async def get_all_payments(self, purpose: Optional[str] = None) -> dict:
        """Return all payment records, optionally filtered by purpose."""
        with get_session() as session:
            stmt = select(Payment)
            if purpose:
                stmt = stmt.where(Payment.purpose == purpose)
            payments = session.exec(stmt).all()
            return {
                "total_records": len(payments),
                "total_amount": sum(p.amount for p in payments),
                "payments": [p.model_dump() for p in payments],
            }

    # ------------------------------------------------------------------
    # 3.  Aliya La-Torah
    # ------------------------------------------------------------------

    async def assign_aliya(
        self,
        congregant_id: str,
        parasha: str,
        aliya_type: str,
        date_str: str = "",
        minhag: str = "",
        donation_amount: float = 0.0,
        notes: str = "",
    ) -> dict:
        """Assign a Torah aliya to a congregant for a given Parasha."""
        aliya = Aliya(
            congregant_id=congregant_id,
            parasha=parasha,
            aliya_type=aliya_type,
            date=date_str or date.today().isoformat(),
            minhag=minhag,
            donation_amount=donation_amount,
            notes=notes,
        )
        with get_session() as session:
            # Auto-record a payment if the congregant pledged at the aliya
            if donation_amount > 0:
                payment = Payment(
                    congregant_id=congregant_id,
                    amount=donation_amount,
                    purpose="aliya",
                    date=date_str or date.today().isoformat(),
                    notes=f"Pledge at aliya: {parasha} – {aliya_type}",
                )
                session.add(payment)
            session.add(aliya)
            session.commit()
            session.refresh(aliya)
            return aliya.model_dump()

    async def get_aliyot_for_parasha(self, parasha: str) -> dict:
        """Return all Aliyot assigned for a specific Parasha."""
        with get_session() as session:
            aliyot = session.exec(
                select(Aliya).where(Aliya.parasha == parasha)
            ).all()
            return {
                "parasha": parasha,
                "total": len(aliyot),
                "aliyot": [a.model_dump() for a in aliyot],
            }

    async def get_aliya_history(self, congregant_id: str) -> dict:
        """Return the full Aliya history for a specific congregant."""
        with get_session() as session:
            aliyot = session.exec(
                select(Aliya).where(Aliya.congregant_id == congregant_id)
            ).all()
            return {
                "congregant_id": congregant_id,
                "total_aliyot": len(aliyot),
                "aliyot": [a.model_dump() for a in aliyot],
            }

    # ------------------------------------------------------------------
    # 4.  Places (sanctuary seating)
    # ------------------------------------------------------------------

    async def add_place(
        self,
        section: str,
        row: str,
        place_number: int,
        congregant_id: Optional[str] = None,
        is_reserved: bool = False,
        annual_fee: float = 0.0,
        notes: str = "",
    ) -> dict:
        """Add a seat to the sanctuary seating map."""
        place = Place(
            section=section,
            row=row,
            place_number=place_number,
            congregant_id=congregant_id,
            is_reserved=is_reserved,
            annual_fee=annual_fee,
            notes=notes,
        )
        with get_session() as session:
            session.add(place)
            session.commit()
            session.refresh(place)
            return place.model_dump()

    async def assign_place(
        self,
        place_id: str,
        congregant_id: str,
        is_reserved: bool = True,
        annual_fee: float = 0.0,
    ) -> dict | None:
        """Assign an existing seat to a congregant."""
        with get_session() as session:
            place = session.get(Place, place_id)
            if not place:
                return None
            place.congregant_id = congregant_id
            place.is_reserved = is_reserved
            if annual_fee:
                place.annual_fee = annual_fee
            session.add(place)
            session.commit()
            session.refresh(place)
            return place.model_dump()

    async def unassign_place(self, place_id: str) -> dict | None:
        """Remove the congregant assignment from a seat."""
        with get_session() as session:
            place = session.get(Place, place_id)
            if not place:
                return None
            place.congregant_id = None
            place.is_reserved = False
            session.add(place)
            session.commit()
            session.refresh(place)
            return place.model_dump()

    async def get_place(self, place_id: str) -> dict | None:
        """Retrieve a single seat by ID."""
        with get_session() as session:
            place = session.get(Place, place_id)
            return place.model_dump() if place else None

    async def list_places(
        self,
        section: Optional[str] = None,
        only_free: bool = False,
    ) -> dict:
        """List all seats, optionally filtered by section or availability."""
        with get_session() as session:
            stmt = select(Place)
            if section:
                stmt = stmt.where(Place.section == section)
            if only_free:
                stmt = stmt.where(Place.congregant_id == None)  # noqa: E711
            places = session.exec(stmt).all()
            return {
                "total": len(places),
                "places": [p.model_dump() for p in places],
            }

    async def get_congregant_place(self, congregant_id: str) -> dict | None:
        """Return the seat assigned to a specific congregant, or None."""
        with get_session() as session:
            place = session.exec(
                select(Place).where(Place.congregant_id == congregant_id)
            ).first()
            return place.model_dump() if place else None

    # ------------------------------------------------------------------
    # 5.  Azkarot (yahrzeit / memorial)
    # ------------------------------------------------------------------

    async def add_azkara(
        self,
        congregant_id: str,
        deceased_name: str,
        deceased_hebrew_name: str = "",
        relation: str = "",
        gregorian_date: str = "",
        hebrew_day: int = 0,
        hebrew_month: int = 0,
        notes: str = "",
    ) -> dict:
        """
        Add a yahrzeit record.

        If gregorian_date is supplied and hebrew_day/month are zero,
        the Hebrew date is computed automatically.
        If only hebrew_day/month are supplied the gregorian_date is left empty.
        """
        day, month = hebrew_day, hebrew_month
        if gregorian_date and (not day or not month):
            d = parse_gregorian_iso(gregorian_date)
            if d:
                heb = gregorian_to_hebrew(d)
                day = heb["day"]
                month = heb["month"]

        azkara = Azkara(
            congregant_id=congregant_id,
            deceased_name=deceased_name,
            deceased_hebrew_name=deceased_hebrew_name,
            relation=relation,
            gregorian_date=gregorian_date,
            hebrew_day=day,
            hebrew_month=month,
            notes=notes,
        )
        with get_session() as session:
            session.add(azkara)
            session.commit()
            session.refresh(azkara)
            return azkara.model_dump()

    async def get_azkara(self, azkara_id: str) -> dict | None:
        with get_session() as session:
            a = session.get(Azkara, azkara_id)
            return a.model_dump() if a else None

    async def list_azkarot(self, congregant_id: Optional[str] = None) -> dict:
        """Return all yahrzeit records, optionally for a specific congregant."""
        with get_session() as session:
            stmt = select(Azkara)
            if congregant_id:
                stmt = stmt.where(Azkara.congregant_id == congregant_id)
            azkarot = session.exec(stmt).all()
            return {
                "total": len(azkarot),
                "azkarot": [a.model_dump() for a in azkarot],
            }

    async def get_upcoming_azkarot(self, days_ahead: int = 30) -> dict:
        """
        Return yahrzeit records whose Hebrew anniversary falls within the
        next `days_ahead` days (default 30), with the next Gregorian date attached.
        """
        with get_session() as session:
            azkarot = session.exec(select(Azkara)).all()

        events = [a.model_dump() for a in azkarot]
        upcoming = upcoming_occurrences(events, days_ahead=days_ahead)
        return {
            "days_ahead": days_ahead,
            "total": len(upcoming),
            "azkarot": upcoming,
        }

    async def delete_azkara(self, azkara_id: str) -> bool:
        with get_session() as session:
            a = session.get(Azkara, azkara_id)
            if not a:
                return False
            session.delete(a)
            session.commit()
            return True

    # ------------------------------------------------------------------
    # 6.  Smachot (lifecycle celebrations)
    # ------------------------------------------------------------------

    async def add_simcha(
        self,
        congregant_id: str,
        occasion_type: str,
        description: str = "",
        gregorian_date: str = "",
        hebrew_day: int = 0,
        hebrew_month: int = 0,
        parasha: str = "",
        notes: str = "",
    ) -> dict:
        """
        Add a simcha record.

        If gregorian_date is supplied and hebrew_day/month are zero,
        the Hebrew date is computed automatically.
        """
        day, month = hebrew_day, hebrew_month
        if gregorian_date and (not day or not month):
            d = parse_gregorian_iso(gregorian_date)
            if d:
                heb = gregorian_to_hebrew(d)
                day = heb["day"]
                month = heb["month"]

        simcha = Simcha(
            congregant_id=congregant_id,
            occasion_type=occasion_type,
            description=description,
            gregorian_date=gregorian_date,
            hebrew_day=day,
            hebrew_month=month,
            parasha=parasha,
            notes=notes,
        )
        with get_session() as session:
            session.add(simcha)
            session.commit()
            session.refresh(simcha)
            return simcha.model_dump()

    async def get_simcha(self, simcha_id: str) -> dict | None:
        with get_session() as session:
            s = session.get(Simcha, simcha_id)
            return s.model_dump() if s else None

    async def list_smachot(
        self,
        congregant_id: Optional[str] = None,
        occasion_type: Optional[str] = None,
    ) -> dict:
        """Return all smachot records, optionally filtered."""
        with get_session() as session:
            stmt = select(Simcha)
            if congregant_id:
                stmt = stmt.where(Simcha.congregant_id == congregant_id)
            if occasion_type:
                stmt = stmt.where(Simcha.occasion_type == occasion_type)
            smachot = session.exec(stmt).all()
            return {
                "total": len(smachot),
                "smachot": [s.model_dump() for s in smachot],
            }

    async def get_upcoming_smachot(
        self,
        days_ahead: int = 30,
        occasion_type: Optional[str] = None,
    ) -> dict:
        """
        Return smachot whose Hebrew anniversary falls within the next
        `days_ahead` days, optionally filtered by occasion type.
        """
        with get_session() as session:
            stmt = select(Simcha)
            if occasion_type:
                stmt = stmt.where(Simcha.occasion_type == occasion_type)
            smachot = session.exec(stmt).all()

        events = [s.model_dump() for s in smachot]
        upcoming = upcoming_occurrences(events, days_ahead=days_ahead)
        return {
            "days_ahead": days_ahead,
            "occasion_type": occasion_type,
            "total": len(upcoming),
            "smachot": upcoming,
        }

    async def delete_simcha(self, simcha_id: str) -> bool:
        with get_session() as session:
            s = session.get(Simcha, simcha_id)
            if not s:
                return False
            session.delete(s)
            session.commit()
            return True

    # ------------------------------------------------------------------
    # 7.  Hebrew ↔ Gregorian calendar utilities
    # ------------------------------------------------------------------

    async def convert_gregorian_to_hebrew(self, date_str: str) -> dict:
        """
        Convert a Gregorian ISO date string to its Hebrew date representation.
        Returns day, month, year, and formatted strings in Hebrew and English.
        """
        d = parse_gregorian_iso(date_str)
        if not d:
            return {"error": f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD."}
        result = gregorian_to_hebrew(d)
        result["gregorian"] = date_str
        return result

    async def convert_hebrew_to_gregorian(
        self,
        year: int,
        month: int,
        day: int,
    ) -> dict:
        """
        Convert a Hebrew date (pyluach month numbering) to its Gregorian equivalent.
        Returns the ISO date string or an error message.
        """
        gd = hebrew_to_gregorian(year, month, day)
        if not gd:
            return {
                "error": f"Invalid or non-existent Hebrew date: {day}/{month}/{year}."
            }
        return {
            "hebrew_year": year,
            "hebrew_month": month,
            "hebrew_day": day,
            "gregorian": gd.isoformat(),
        }

    async def get_next_hebrew_occurrence(
        self,
        hebrew_month: int,
        hebrew_day: int,
        from_date_str: str = "",
    ) -> dict:
        """
        Return the next Gregorian date on which a recurring Hebrew calendar
        date (month + day) will fall.
        """
        from_date = parse_gregorian_iso(from_date_str) if from_date_str else date.today()
        next_date = get_next_occurrence(hebrew_month, hebrew_day, from_date)
        if not next_date:
            return {"error": "Could not determine next occurrence."}
        return {
            "hebrew_month": hebrew_month,
            "hebrew_day": hebrew_day,
            "next_gregorian": next_date.isoformat(),
        }

    async def list_hebrew_months(self) -> dict:
        """Return a reference list of all Hebrew month names."""
        return {"months": hebrew_month_list()}


synagogue_service = SynagogueService()
