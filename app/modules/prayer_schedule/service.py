"""Prayer Schedule business-logic layer."""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlmodel import select

from datetime import timedelta

from app.core.authorization import require_service_operational
from app.core.db import get_session
from app.core.hebrew_date import gregorian_to_hebrew
from app.core.zmanim import get_day_times, get_day_zmanim, get_shabbat_times, get_full_shabbat_info
from app.modules.auth.models import User
from app.modules.prayer_schedule.models import PrayerRule, SpecialDay

# ─── Anchor → zmanim key mapping ────────────────────────────────────────────

_ANCHOR_KEYS: dict[str, str] = {
    "alot_hashachar": "alot_hashachar",
    "sunrise":        "sunrise",
    "chatzot":        "chatzot",
    "mincha_gedola":  "mincha_gedola",
    "plag_hamincha":  "plag_hamincha",
    "sunset":         "sunset",
    "tzeit":          "tzeit_hakochavim",
    "candle_lighting": "candle_lighting",
    "havdalah":       "havdalah",
}

# ─── Day-type detection ───────────────────────────────────────────────────────

# Major Yom Tov dates as (hebrew_month, hebrew_day) pairs.
# Month numbering follows pyluach: 1=Nisan, 7=Tishri, 8=Cheshvan …
_ROSH_HASHANA = {(7, 1), (7, 2)}
_YOM_KIPPUR   = {(7, 10)}
_YOM_TOV = {
    (7, 15), (7, 16),          # Sukkot
    (7, 22), (7, 23),          # Shmini Atzeret / Simchat Torah
    (1, 15), (1, 16),          # Pesach first days
    (1, 21), (1, 22),          # Pesach last days
    (3, 6),  (3, 7),           # Shavuot
}


def _detect_day_type(d: date, special_days: list[SpecialDay]) -> str:
    """Return the prayer-schedule day-type string for a given Gregorian date."""
    # Shabbat — Python weekday: 0=Mon … 5=Sat
    if d.weekday() == 5:
        return "shabbat"

    heb = gregorian_to_hebrew(d)
    month, day = heb["month"], heb["day"]

    if (month, day) in _ROSH_HASHANA:
        return "rosh_hashana"
    if (month, day) in _YOM_KIPPUR:
        return "yom_kippur"
    if (month, day) in _YOM_TOV:
        return "yom_tov"

    for sd in special_days:
        if sd.hebrew_month == month and sd.hebrew_day == day:
            return "special"

    return "daily"


def _prev_friday(d: date) -> date:
    """Most recent Friday (today if today is Friday)."""
    return d - timedelta(days=(d.weekday() - 4) % 7)


def _next_friday(d: date) -> date:
    """Next Friday strictly after today (or 7 days ahead if today is Friday)."""
    days = (4 - d.weekday()) % 7
    return d + timedelta(days=days if days else 7)


def _this_week_tuesday(d: date) -> date:
    """Tuesday of the current Jewish week (week starts Sunday)."""
    sun_based = (d.weekday() + 1) % 7   # Sun=0, Mon=1, Tue=2 …
    last_sunday = d - timedelta(days=sun_based)
    return last_sunday + timedelta(days=2)


def _jewish_weekday(d: date) -> int:
    """Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6."""
    return (d.weekday() + 1) % 7


def _parse_days(rule: "PrayerRule") -> Optional[set[int]]:
    """Return the set of allowed weekday ints for this rule, or None (= every day)."""
    raw = rule.days_of_week
    if raw:
        try:
            return {int(x) for x in raw.split(",") if x.strip()}
        except ValueError:
            pass
    # Legacy fallback
    if rule.day_of_week is not None:
        return {rule.day_of_week}
    return None


def _hhmm_add_offset(time_str: str, offset_minutes: int) -> str:
    """Add signed offset (minutes) to an HH:MM string, clamped to [00:00, 23:59]."""
    h, m = map(int, time_str.split(":"))
    total = max(0, min(h * 60 + m + offset_minutes, 23 * 60 + 59))
    return f"{total // 60:02d}:{total % 60:02d}"


# ─── Service ─────────────────────────────────────────────────────────────────

class PrayerScheduleService:

    # ── Prayer Rules ──────────────────────────────────────────────────────────

    def get_rules(self, day_type: Optional[str] = None) -> list[dict]:
        with get_session() as session:
            stmt = select(PrayerRule)
            if day_type:
                stmt = stmt.where(PrayerRule.day_type == day_type)
            stmt = stmt.order_by(PrayerRule.day_type, PrayerRule.display_order)
            rules = session.exec(stmt).all()
            return [r.model_dump() for r in rules]

    def create_rule(
        self,
        name: str,
        day_type: str,
        anchor: str,
        offset_minutes: int = 0,
        exact_time: Optional[str] = None,
        free_text: Optional[str] = None,
        no_auto_time: bool = False,
        is_lesson: bool = False,
        days_of_week: Optional[str] = None,
        notes: str = "",
        display_order: int = 0,
        is_active: bool = True,
        *,
        actor: User,
    ) -> dict:
        require_service_operational(actor)
        rule = PrayerRule(
            name=name,
            day_type=day_type,
            anchor=anchor,
            offset_minutes=offset_minutes,
            exact_time=exact_time,
            free_text=free_text or None,
            no_auto_time=no_auto_time,
            is_lesson=is_lesson,
            days_of_week=days_of_week,
            notes=notes,
            display_order=display_order,
            is_active=is_active,
        )
        with get_session() as session:
            session.add(rule)
            session.commit()
            session.refresh(rule)
            return rule.model_dump()

    def update_rule(self, rule_id: str, *, actor: User, **fields) -> dict:
        require_service_operational(actor)
        with get_session() as session:
            rule = session.get(PrayerRule, rule_id)
            if not rule:
                raise ValueError(f"Rule {rule_id} not found")
            # Allow explicit None values (e.g. clearing days_of_week) by not guarding on None
            for key, value in fields.items():
                if hasattr(rule, key):
                    setattr(rule, key, value)
            session.add(rule)
            session.commit()
            session.refresh(rule)
            return rule.model_dump()

    def delete_rule(self, rule_id: str, *, actor: User) -> dict:
        require_service_operational(actor)
        with get_session() as session:
            rule = session.get(PrayerRule, rule_id)
            if not rule:
                raise ValueError(f"Rule {rule_id} not found")
            session.delete(rule)
            session.commit()
        return {"deleted": rule_id}

    def reorder_rules(
        self,
        day_type: str,
        ordered_ids: list[str],
        *,
        actor: User,
    ) -> dict:
        require_service_operational(actor)
        with get_session() as session:
            for i, rid in enumerate(ordered_ids):
                rule = session.get(PrayerRule, rid)
                if rule and rule.day_type == day_type:
                    rule.display_order = i
                    session.add(rule)
            session.commit()
        return {"reordered": len(ordered_ids)}

    # ── Schedule Calculation ──────────────────────────────────────────────────

    async def calculate_times(self, date_str: str) -> dict:
        """
        Resolve prayer rules for the given date to actual HH:MM times.

        1. Determine day_type from Hebrew calendar + weekday.
        2. Fetch matching rules from DB.
        3. Fetch zmanim from Hebcal.
        4. Apply anchor + offset to produce calculated_time for each rule.
        """
        try:
            d = date.fromisoformat(date_str)
        except ValueError as exc:
            raise ValueError(f"Invalid date: {date_str}") from exc

        with get_session() as session:
            special_days = session.exec(select(SpecialDay)).all()

        day_type = _detect_day_type(d, list(special_days))
        weekday = _jewish_weekday(d)   # Sun=0 … Sat=6

        with get_session() as session:
            all_type_rules = session.exec(
                select(PrayerRule)
                .where(PrayerRule.day_type == day_type, PrayerRule.is_active == True)  # noqa: E712
                .order_by(PrayerRule.display_order)
            ).all()

        # For lessons with days_of_week set, only include those matching today's weekday
        rules = [
            r for r in all_type_rules
            if (allowed := _parse_days(r)) is None or weekday in allowed
        ]

        zmanim = await get_day_times(d)

        # Pre-fetch extra zmanim only when needed (lazy, cached per resolve call)
        _extra_zmanim: dict[str, dict] = {}

        async def _extra(key: str, fetch_date: date) -> dict:
            if key not in _extra_zmanim:
                _extra_zmanim[key] = await get_day_times(fetch_date)
            return _extra_zmanim[key]

        resolved: list[dict] = []
        for rule in rules:
            if rule.no_auto_time:
                calc_time = None
            elif rule.free_text:
                calc_time = rule.free_text
            elif rule.anchor == "fixed":
                calc_time = rule.exact_time or "—"
            elif rule.anchor in ("candle_lighting", "next_candle_lighting"):
                # If calculating for Saturday, candle lighting is the *previous* Friday
                fri = _prev_friday(d) if d.weekday() == 5 else _next_friday(d)
                fri_zmanim = await _extra("candle_fri", fri)
                base_time = fri_zmanim.get("candle_lighting")
                calc_time = _hhmm_add_offset(base_time, rule.offset_minutes) if base_time else None
            elif rule.anchor == "havdalah":
                # Havdalah is on the current Saturday (if d is Saturday) or next Saturday
                sat = d if d.weekday() == 5 else _next_friday(d) + timedelta(days=1)
                sat_zmanim = await _extra("havdalah_sat", sat)
                base_time = sat_zmanim.get("havdalah")
                calc_time = _hhmm_add_offset(base_time, rule.offset_minutes) if base_time else None
            elif rule.anchor == "tuesday_sunset":
                tue_zmanim = await _extra("tuesday", _this_week_tuesday(d))
                base_time = tue_zmanim.get("sunset")
                calc_time = _hhmm_add_offset(base_time, rule.offset_minutes) if base_time else None
            else:
                anchor_key = _ANCHOR_KEYS.get(rule.anchor)
                base_time = zmanim.get(anchor_key) if anchor_key else None
                calc_time = _hhmm_add_offset(base_time, rule.offset_minutes) if base_time else None

            offset_label = ""
            if rule.anchor != "fixed" and rule.offset_minutes != 0:
                sign = "+" if rule.offset_minutes > 0 else ""
                offset_label = f"{sign}{rule.offset_minutes} דקות"

            resolved.append({
                **rule.model_dump(),
                "calculated_time": calc_time,
                "offset_label": offset_label,
            })

        heb_info = gregorian_to_hebrew(d)
        return {
            "date": date_str,
            "day_type": day_type,
            "hebrew_date": heb_info.get("formatted_hebrew", ""),
            "city": zmanim.get("city", ""),
            "zmanim": zmanim,
            "prayers": resolved,
        }

    async def get_week_schedule(self, from_date_str: str) -> dict:
        """Return calculated schedules for 7 consecutive days starting from from_date."""
        from_date = date.fromisoformat(from_date_str)
        days = []
        for i in range(7):
            d = from_date + timedelta(days=i)
            day_data = await self.calculate_times(d.isoformat())
            days.append(day_data)
        return {"from": from_date_str, "days": days}

    async def generate_weekly(self, week_start_str: Optional[str] = None) -> dict:
        """
        Generate a formatted Hebrew weekly prayer schedule text.

        Produces Shabbat block, weekday block, and any holiday blocks for
        the calendar week that contains ``week_start_str`` (or today if omitted).
        """
        anchor = date.fromisoformat(week_start_str) if week_start_str else date.today()

        # Sunday of the week (Python: Mon=0 … Sun=6  →  shift so Sun=0)
        sun_offset = (anchor.weekday() + 1) % 7
        week_sunday = anchor - timedelta(days=sun_offset)
        friday   = week_sunday + timedelta(days=5)
        saturday = week_sunday + timedelta(days=6)

        # Fetch all zmanim concurrently
        import asyncio
        tuesday = week_sunday + timedelta(days=2)
        shabbat_info, fri_z, sat_z, tue_z = await asyncio.gather(
            get_full_shabbat_info(friday),
            get_day_times(friday),
            get_day_times(saturday),
            get_day_times(tuesday),
        )

        with get_session() as session:
            special_days_db = list(session.exec(select(SpecialDay)).all())
            all_rules = list(session.exec(
                select(PrayerRule)
                .where(PrayerRule.is_active == True)  # noqa: E712
                .order_by(PrayerRule.display_order)
            ).all())

        rules_by_type: dict[str, list[PrayerRule]] = {}
        for rule in all_rules:
            rules_by_type.setdefault(rule.day_type, []).append(rule)

        def _resolve(rule: PrayerRule, day_z: dict) -> str:
            if rule.no_auto_time:
                return ""
            if rule.free_text:
                return rule.free_text
            if rule.anchor == "fixed":
                return rule.exact_time or "—"
            if rule.anchor in ("candle_lighting", "next_candle_lighting"):
                base = fri_z.get("candle_lighting") or shabbat_info.get("candle_lighting")
            elif rule.anchor == "havdalah":
                base = sat_z.get("havdalah") or shabbat_info.get("havdalah")
            elif rule.anchor == "tuesday_sunset":
                base = tue_z.get("sunset")
            else:
                key = _ANCHOR_KEYS.get(rule.anchor)
                base = day_z.get(key) if key else None
            return _hhmm_add_offset(base, rule.offset_minutes) if base else "—"

        def _sort_rules(rules: list[PrayerRule], day_z: dict) -> list[tuple[PrayerRule, str]]:
            resolved = [(_r, _resolve(_r, day_z)) for _r in rules]
            return sorted(resolved, key=lambda x: (x[1] == "—", x[1]))

        def _rule_line(rule: PrayerRule, time: str, prefix: str = "") -> str:
            if rule.is_lesson:
                if not rule.no_auto_time and time and time != "—":
                    lesson_time = f"{time} ({rule.notes})" if rule.notes else time
                else:
                    lesson_time = rule.notes or ""
                if lesson_time:
                    line = f"{prefix}{lesson_time} - {rule.name}"
                else:
                    line = f"{prefix}{rule.name}"
            else:
                no_time = rule.no_auto_time or not time
                if no_time:
                    line = f"{prefix}{rule.name}"
                else:
                    line = f"{prefix}{rule.name}: {time}"
                if rule.notes:
                    line += f" - {rule.notes}"
            return line

        lines: list[str] = []

        # ── Shabbat block ─────────────────────────────────────────────────────
        sat_heb = gregorian_to_hebrew(saturday)
        sat_greg = f"{saturday.day}.{saturday.month}.{saturday.year}"
        title = "שבת"
        if shabbat_info.get("parasha_he"):
            title += f" פרשת {shabbat_info['parasha_he']}"
        if shabbat_info.get("special_shabbat_he"):
            title += f" ({shabbat_info['special_shabbat_he']})"
        title += f" - {sat_heb['formatted_hebrew']} ({sat_greg})"
        lines.append(title)

        for rule, time in _sort_rules(rules_by_type.get("shabbat", []), sat_z):
            prefix = "🕯️" if rule.anchor == "candle_lighting" else \
                     "🌅 " if rule.anchor == "havdalah" else ""
            lines.append(_rule_line(rule, time, prefix))

        lines.append("")

        # ── Weekday block ─────────────────────────────────────────────────────
        sun_heb = gregorian_to_hebrew(week_sunday)
        thu = week_sunday + timedelta(days=4)
        thu_heb = gregorian_to_hebrew(thu)
        sun_greg = f"{week_sunday.day}.{week_sunday.month}.{week_sunday.year}"
        thu_greg = f"{thu.day}.{thu.month}.{thu.year}"
        lines.append(
            f"סדרי התפילה לימי ראשון-חמישי"
            f" ({sun_heb['formatted_hebrew']}–{thu_heb['formatted_hebrew']}"
            f" {sun_greg}–{thu_greg})"
        )

        for rule, time in _sort_rules(rules_by_type.get("daily", []), tue_z):
            lines.append(_rule_line(rule, time))

        # ── Holiday/special-day blocks within the week ─────────────────────────
        _fetched_extra: dict[str, dict] = {}

        for i in range(5):   # Sunday … Thursday
            d = week_sunday + timedelta(days=i)
            day_type = _detect_day_type(d, special_days_db)
            if day_type in ("daily", "shabbat"):
                continue

            d_iso = d.isoformat()
            if d_iso not in _fetched_extra:
                _fetched_extra[d_iso] = await get_day_times(d)
            d_z = _fetched_extra[d_iso]

            day_heb_info = gregorian_to_hebrew(d)
            day_greg = f"{d.day}.{d.month}.{d.year}"

            if day_type == "special":
                hm, hd = day_heb_info["month"], day_heb_info["day"]
                day_name = next(
                    (sd.name for sd in special_days_db
                     if sd.hebrew_month == hm and sd.hebrew_day == hd),
                    day_heb_info["formatted_hebrew"],
                )
            else:
                _type_labels = {
                    "yom_tov": "יום טוב",
                    "rosh_hashana": "ראש השנה",
                    "yom_kippur": "יום כיפור",
                }
                day_name = _type_labels.get(day_type, day_type)
                day_name += f" – {day_heb_info['formatted_hebrew']} ({day_greg})"

            lines.append("")
            lines.append(day_name)
            for rule, time in _sort_rules(rules_by_type.get(day_type, []), d_z):
                lines.append(_rule_line(rule, time))

        # ── שיעורים קבועים — day-specific lessons ──────────────────────────────
        _DAY_NAMES = {
            0: "יום א'", 1: "יום ב'", 2: "יום ג'",
            3: "יום ד'", 4: "יום ה'", 5: "ערב שבת",
        }
        # Map each day (Sun=0 … Fri=5) to the lessons assigned to it
        day_lessons: dict[int, list[PrayerRule]] = {i: [] for i in range(6)}

        for rule in rules_by_type.get("daily", []):
            if not rule.is_lesson:
                continue
            allowed = _parse_days(rule)
            if allowed is None:
                continue   # "every day" lessons appear in the main weekday block
            for dow in allowed:
                if dow in day_lessons:
                    day_lessons[dow].append(rule)

        # Zmanim by day-of-week for accurate time resolution
        _dow_zmanim: dict[int, dict] = {
            0: await get_day_times(week_sunday),
            1: await get_day_times(week_sunday + timedelta(days=1)),
            2: tue_z,
            3: await get_day_times(week_sunday + timedelta(days=3)),
            4: await get_day_times(week_sunday + timedelta(days=4)),
            5: fri_z,
        }

        has_day_lessons = any(day_lessons[i] for i in range(6))
        if has_day_lessons:
            lines.append("")
            lines.append("שיעורים קבועים במהלך השבוע:")
            for dow in range(6):
                for rule in day_lessons[dow]:
                    dz = _dow_zmanim.get(dow, tue_z)
                    time = _resolve(rule, dz) if not rule.no_auto_time else ""
                    parts = [_DAY_NAMES[dow]]
                    if not rule.no_auto_time and time and time != "—":
                        lesson_time = f"{time} ({rule.notes})" if rule.notes else time
                    else:
                        lesson_time = rule.notes or ""
                    if lesson_time:
                        parts.append(lesson_time)
                    parts.append(rule.name)
                    lines.append(" - ".join(parts))

        return {
            "text": "\n".join(lines),
            "week_start": week_sunday.isoformat(),
            "shabbat_date": saturday.isoformat(),
        }

    # ── Special Days ──────────────────────────────────────────────────────────

    def get_special_days(self) -> list[dict]:
        with get_session() as session:
            days = session.exec(
                select(SpecialDay).order_by(SpecialDay.hebrew_month, SpecialDay.hebrew_day)
            ).all()
            return [d.model_dump() for d in days]

    def create_special_day(
        self,
        name: str,
        hebrew_month: int,
        hebrew_day: int,
        notes: str = "",
        *,
        actor: User,
    ) -> dict:
        require_service_operational(actor)
        sd = SpecialDay(name=name, hebrew_month=hebrew_month, hebrew_day=hebrew_day, notes=notes)
        with get_session() as session:
            session.add(sd)
            session.commit()
            session.refresh(sd)
            return sd.model_dump()

    def delete_special_day(self, day_id: str, *, actor: User) -> dict:
        require_service_operational(actor)
        with get_session() as session:
            sd = session.get(SpecialDay, day_id)
            if not sd:
                raise ValueError(f"Special day {day_id} not found")
            session.delete(sd)
            session.commit()
        return {"deleted": day_id}


prayer_schedule_service = PrayerScheduleService()
