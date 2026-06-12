"""
SQLModel database table definitions.

Each class with table=True maps directly to a database table.

Tables
------
congregants   – synagogue members (regular / guest / occasional)
payments      – donations and dues
aliyot        – Torah aliya assignments
places        – fixed/reserved seating in the sanctuary
azkarot       – yahrzeit / memorial records for deceased relatives
smachot       – lifecycle celebrations (birthday, anniversary, bar/bat mitzvah …)
"""

from __future__ import annotations

import uuid
from typing import Literal, Optional

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Congregant (Mispallel)
# ---------------------------------------------------------------------------

MemberType = Literal["regular", "guest", "occasional"]


class Congregant(SQLModel, table=True):
    __tablename__ = "congregants"

    id: str = Field(default_factory=_new_id, primary_key=True)
    first_name: str
    last_name: str
    hebrew_name: str = ""
    father_name: str = ""           # ben / bat …
    mother_name: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    is_kohen: bool = False
    is_levi: bool = False
    # regular = permanent member, guest = one-time visitor, occasional = drops in
    member_type: str = "regular"    # MemberType values; stored as str for SQLite
    notes: str = ""
    join_date: str = ""             # ISO date string
    is_archived: bool = False       # soft-delete / archive flag
    archived_at: str = ""           # ISO date string when archived


# ---------------------------------------------------------------------------
# Payment / Donation
# ---------------------------------------------------------------------------

class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(foreign_key="congregants.id", index=True)
    amount: float
    currency: str = "ILS"
    purpose: str                    # e.g. "aliya", "kiddush", "annual_dues", "donation"
    date: str = ""                  # ISO date string e.g. "2026-06-07"
    notes: str = ""


# ---------------------------------------------------------------------------
# Aliya La-Torah
# ---------------------------------------------------------------------------

class Aliya(SQLModel, table=True):
    __tablename__ = "aliyot"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(foreign_key="congregants.id", index=True)
    parasha: str
    aliya_type: str                 # Kohen, Levi, Shlishi, Revi'i, Chamishi, Shishi, Shvi'i, Maftir
    date: str = ""                  # ISO date string
    minhag: str = ""                # e.g. "Ashkenaz", "Sephard"
    donation_amount: float = 0.0   # pledge made at the time of the aliya
    notes: str = ""


# ---------------------------------------------------------------------------
# Place – sanctuary seating assignment
# ---------------------------------------------------------------------------

class Place(SQLModel, table=True):
    __tablename__ = "places"

    id: str = Field(default_factory=_new_id, primary_key=True)
    section: str                    # e.g. "main", "east", "balcony", "women"
    row: str                        # row letter or number, e.g. "A" or "3"
    place_number: int               # seat number within the row
    congregant_id: Optional[str] = Field(
        default=None, foreign_key="congregants.id", index=True
    )
    is_reserved: bool = False       # permanently reserved (annual rental)
    annual_fee: float = 0.0
    notes: str = ""


# ---------------------------------------------------------------------------
# Azkara – yahrzeit / memorial for a deceased relative
# ---------------------------------------------------------------------------

class Azkara(SQLModel, table=True):
    __tablename__ = "azkarot"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(foreign_key="congregants.id", index=True)
    deceased_name: str              # transliterated / display name
    deceased_hebrew_name: str = "" # full Hebrew name (e.g. "יעקב בן אברהם")
    relation: str = ""             # father, mother, spouse, sibling, child, other
    # Hebrew date components (pyluach month numbering, see hebrew_date.py)
    hebrew_day: int = 0
    hebrew_month: int = 0
    # Gregorian anchor date (the actual passing; used to derive Hebrew date)
    gregorian_date: str = ""       # ISO date string
    # Year the person passed away (Gregorian) — used to calculate yahrzeit number
    year_occurred: Optional[int] = Field(default=None, nullable=True)
    notes: str = ""


# ---------------------------------------------------------------------------
# Simcha – lifecycle celebration
# ---------------------------------------------------------------------------

SimchaType = Literal[
    "birthday",      # Hebrew birthday
    "anniversary",   # Wedding anniversary
    "bar_mitzvah",   # Bar/Bat Mitzvah
    "bat_mitzvah",
    "brit",          # Brit Milah
    "upsherin",
    "other",
]


class Simcha(SQLModel, table=True):
    __tablename__ = "smachot"

    id: str = Field(default_factory=_new_id, primary_key=True)
    congregant_id: str = Field(foreign_key="congregants.id", index=True)
    occasion_type: str             # SimchaType values; stored as str for SQLite
    description: str = ""          # free-form label, e.g. "50th anniversary"
    # Hebrew date of the occasion (for yearly recurring reminders)
    hebrew_day: int = 0
    hebrew_month: int = 0
    # Gregorian anchor date (the actual calendar date of the event)
    gregorian_date: str = ""       # ISO date string
    # For bar/bat mitzvah – the Torah portion
    parasha: str = ""
    # Year the event occurred (Gregorian) — used to calculate age / number of years
    year_occurred: Optional[int] = Field(default=None, nullable=True)
    notes: str = ""
