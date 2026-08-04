"""Prayer Schedule database models."""

from __future__ import annotations

import uuid
from typing import Optional

from sqlmodel import Field, SQLModel


def _new_id() -> str:
    return str(uuid.uuid4())


class PrayerRule(SQLModel, table=True):
    __tablename__ = "prayer_rules"

    id: str = Field(default_factory=_new_id, primary_key=True)
    name: str                                        # e.g. "שחרית", "מנחה", "מעריב"
    day_type: str = Field(index=True)               # daily | shabbat | yom_tov | rosh_hashana | yom_kippur | special
    anchor: str                                      # fixed | sunrise | sunset | candle_lighting | havdalah | chatzot | plag_hamincha | tzeit | alot_hashachar | mincha_gedola
    offset_minutes: int = 0                          # signed offset from anchor (negative = before)
    exact_time: Optional[str] = None                 # HH:MM — used only when anchor == "fixed"
    free_text: Optional[str] = None                  # overrides computed time in all displays
    no_auto_time: bool = False                        # when True, no time is shown at all
    is_lesson: bool = False                           # when True, rendered in green; report format: time - name
    day_of_week: Optional[int] = None                # legacy single-day; superseded by days_of_week
    days_of_week: Optional[str] = None               # comma-separated ints: "0,1,5" = Sun,Mon,Fri; None = every day
    notes: str = ""                                  # lesson time text / extra info
    display_order: int = 0                           # sort order within a day_type
    is_active: bool = True


class SpecialDay(SQLModel, table=True):
    __tablename__ = "prayer_special_days"

    id: str = Field(default_factory=_new_id, primary_key=True)
    name: str                                        # e.g. "יום ירושלים"
    hebrew_month: int                                # pyluach month number (1=Nisan … 7=Tishri …)
    hebrew_day: int
    notes: str = ""
