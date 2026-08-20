"""Weekly bulletin assembly and rendering."""

from __future__ import annotations

from datetime import date, timedelta
from html import escape
from typing import Optional
from urllib.parse import quote

from sqlmodel import select

from app.core.authorization import require_service_operational
from app.core.db import get_session
from app.core.hebrew_date import upcoming_occurrences
from app.core.tenant import TenantConfig
from app.core.zmanim import get_full_shabbat_info
from app.modules.auth.models import User
from app.modules.azkarot.models import Azkara
from app.modules.bulletin.models import (
    DEFAULT_SECTIONS,
    BulletinConfig,
    BulletinWeekOverride,
)
from app.modules.congregants.models import Congregant
from app.modules.prayer_schedule.service import prayer_schedule_service
from app.modules.smachot.models import Simcha

ALL_SECTIONS = ["times", "prayers", "azkarot", "smachot", "announcements"]

RELATION_LABELS = {
    "father": "אבא",
    "mother": "אמא",
    "spouse": "בן/בת זוג",
    "sibling": "אח/אחות",
    "child": "ילד",
    "other": "קרוב משפחה",
}

OCCASION_LABELS = {
    "birthday": "יום הולדת",
    "anniversary": "יום נישואין",
    "bar_mitzvah": "בר מצוה",
    "bat_mitzvah": "בת מצוה",
    "brit": "ברית מילה",
    "upsherin": "חלאקה",
    "other": "שמחה",
}


def _week_sunday(anchor: date) -> date:
    sun_offset = (anchor.weekday() + 1) % 7
    return anchor - timedelta(days=sun_offset)


def _parse_sections(raw: Optional[str]) -> list[str]:
    if not raw:
        return list(ALL_SECTIONS)
    requested = [part.strip() for part in raw.split(",") if part.strip()]
    return [section for section in requested if section in ALL_SECTIONS] or list(ALL_SECTIONS)


def _whatsapp_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    if digits.startswith("0"):
        digits = "972" + digits[1:]
    return digits


def _wa_link(text: str, phone: str = "") -> str:
    encoded = quote(text)
    if phone:
        return f"https://wa.me/{_whatsapp_phone(phone)}?text={encoded}"
    return f"https://wa.me/?text={encoded}"


class BulletinService:

    def _get_or_create_config(self) -> BulletinConfig:
        with get_session() as session:
            config = session.get(BulletinConfig, 1)
            if not config:
                config = BulletinConfig()
                session.add(config)
                session.commit()
                session.refresh(config)
            return config

    def get_config(self, *, actor: User) -> dict:
        require_service_operational(actor)
        return self._get_or_create_config().model_dump()

    def update_config(self, *, actor: User, **fields) -> dict:
        require_service_operational(actor)
        with get_session() as session:
            config = session.get(BulletinConfig, 1) or BulletinConfig()
            for key, value in fields.items():
                if hasattr(config, key) and value is not None:
                    setattr(config, key, value)
            session.add(config)
            session.commit()
            session.refresh(config)
            return config.model_dump()

    def save_week_override(self, week_start: str, sections: list[str], *, actor: User) -> dict:
        require_service_operational(actor)
        cleaned = [s for s in sections if s in ALL_SECTIONS]
        sections_str = ",".join(cleaned) if cleaned else DEFAULT_SECTIONS
        with get_session() as session:
            existing = session.exec(
                select(BulletinWeekOverride).where(BulletinWeekOverride.week_start == week_start)
            ).first()
            if existing:
                existing.sections = sections_str
                session.add(existing)
            else:
                existing = BulletinWeekOverride(week_start=week_start, sections=sections_str)
                session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing.model_dump()

    def _resolve_sections(
        self,
        week_start: str,
        requested: Optional[str],
        config: BulletinConfig,
    ) -> list[str]:
        if requested is not None:
            return _parse_sections(requested)
        with get_session() as session:
            override = session.exec(
                select(BulletinWeekOverride).where(BulletinWeekOverride.week_start == week_start)
            ).first()
        if override:
            return _parse_sections(override.sections)
        return _parse_sections(config.default_sections)

    def _congregant_map(self) -> dict[str, dict]:
        with get_session() as session:
            congregants = session.exec(select(Congregant)).all()
        return {
            c.id: {
                "name": f"{c.first_name} {c.last_name}".strip(),
                "phone": c.phone or "",
            }
            for c in congregants
        }

    def _week_azkarot(self, week_sunday: date) -> list[dict]:
        congregant_map = self._congregant_map()
        with get_session() as session:
            rows = list(session.exec(select(Azkara)).all())
        events = [row.model_dump() for row in rows]
        upcoming = upcoming_occurrences(events, days_ahead=6, from_date=week_sunday)
        for item in upcoming:
            info = congregant_map.get(item.get("congregant_id"), {})
            item["congregant_name"] = info.get("name", "")
            item["congregant_phone"] = info.get("phone", "")
            relation = RELATION_LABELS.get(item.get("relation", ""), item.get("relation", ""))
            item["relation_label"] = relation
            message = (
                f"שלום, תזכורת מאזכרה של {item.get('deceased_name', '')}"
                f" בתאריך {item.get('next_gregorian', '')}."
            )
            item["whatsapp_url"] = _wa_link(message, item["congregant_phone"])
        return upcoming

    def _week_smachot(self, week_sunday: date) -> list[dict]:
        congregant_map = self._congregant_map()
        with get_session() as session:
            rows = list(session.exec(select(Simcha)).all())
        events = [row.model_dump() for row in rows]
        upcoming = upcoming_occurrences(events, days_ahead=6, from_date=week_sunday)
        for item in upcoming:
            info = congregant_map.get(item.get("congregant_id"), {})
            item["congregant_name"] = info.get("name", "")
            item["congregant_phone"] = info.get("phone", "")
            occasion = OCCASION_LABELS.get(
                item.get("occasion_type", ""),
                item.get("occasion_type", ""),
            )
            item["occasion_label"] = occasion
            message = (
                f"שלום, ברכות לרגל {occasion}"
                f" בתאריך {item.get('next_gregorian', '')}."
            )
            item["whatsapp_url"] = _wa_link(message, item["congregant_phone"])
        return upcoming

    def _render_whatsapp(self, payload: dict, sections: list[str]) -> str:
        lines: list[str] = [f"*{payload['synagogue_name']}*"]
        if payload.get("rabbi"):
            lines.append(f"רב בית הכנסת: {payload['rabbi']}")
        if payload.get("address"):
            lines.append(payload["address"])
        lines.append("")

        if "times" in sections:
            title = "שבת"
            if payload.get("parasha"):
                title += f" פרשת {payload['parasha']}"
            if payload.get("special_shabbat"):
                title += f" ({payload['special_shabbat']})"
            lines.append(f"*{title}*")
            if payload.get("candle_lighting"):
                lines.append(f"הדלקת נרות: {payload['candle_lighting']}")
            if payload.get("havdalah"):
                lines.append(f"הבדלה: {payload['havdalah']}")
            lines.append("")

        if "prayers" in sections and payload.get("prayer_text"):
            lines.append(payload["prayer_text"].rstrip())
            lines.append("")

        if "azkarot" in sections and payload.get("azkarot"):
            lines.append("*אזכרות השבוע*")
            for item in payload["azkarot"]:
                extra = f" · של {item['congregant_name']}" if item.get("congregant_name") else ""
                lines.append(
                    f"• {item.get('deceased_name', '')}{extra} · {item.get('next_gregorian', '')}"
                )
            lines.append("")

        if "smachot" in sections and payload.get("smachot"):
            lines.append("*שמחות השבוע*")
            for item in payload["smachot"]:
                extra = f" · של {item['congregant_name']}" if item.get("congregant_name") else ""
                lines.append(
                    f"• {item.get('occasion_label', '')}{extra} · {item.get('next_gregorian', '')}"
                )
            lines.append("")

        if "announcements" in sections and payload.get("announcements"):
            lines.append("*הכרזות*")
            lines.append(payload["announcements"].rstrip())
            lines.append("")

        return "\n".join(lines).strip() + "\n"

    def _render_html(self, payload: dict, sections: list[str], *, printable: bool) -> str:
        blocks: list[str] = []
        name = escape(payload["synagogue_name"])
        blocks.append(f"<h1>{name}</h1>")
        if payload.get("rabbi"):
            blocks.append(f"<p>רב בית הכנסת: {escape(payload['rabbi'])}</p>")
        if payload.get("address"):
            blocks.append(f"<p>{escape(payload['address'])}</p>")

        if "times" in sections:
            title = "שבת"
            if payload.get("parasha"):
                title += f" פרשת {escape(payload['parasha'])}"
            if payload.get("special_shabbat"):
                title += f" ({escape(payload['special_shabbat'])})"
            blocks.append(f"<h2>{title}</h2>")
            times: list[str] = []
            if payload.get("candle_lighting"):
                times.append(f"<li>הדלקת נרות: {escape(payload['candle_lighting'])}</li>")
            if payload.get("havdalah"):
                times.append(f"<li>הבדלה: {escape(payload['havdalah'])}</li>")
            if times:
                blocks.append("<ul>" + "".join(times) + "</ul>")

        if "prayers" in sections and payload.get("prayer_text"):
            blocks.append("<h2>סדרי התפילה</h2>")
            prayer_html = escape(payload["prayer_text"]).replace("\n", "<br>\n")
            blocks.append(f"<p>{prayer_html}</p>")

        if "azkarot" in sections and payload.get("azkarot"):
            blocks.append("<h2>אזכרות השבוע</h2><ul>")
            for item in payload["azkarot"]:
                extra = f" · של {escape(item['congregant_name'])}" if item.get("congregant_name") else ""
                blocks.append(
                    f"<li>{escape(item.get('deceased_name', ''))}{extra}"
                    f" · {escape(item.get('next_gregorian', ''))}</li>"
                )
            blocks.append("</ul>")

        if "smachot" in sections and payload.get("smachot"):
            blocks.append("<h2>שמחות השבוע</h2><ul>")
            for item in payload["smachot"]:
                extra = f" · של {escape(item['congregant_name'])}" if item.get("congregant_name") else ""
                blocks.append(
                    f"<li>{escape(item.get('occasion_label', ''))}{extra}"
                    f" · {escape(item.get('next_gregorian', ''))}</li>"
                )
            blocks.append("</ul>")

        if "announcements" in sections and payload.get("announcements"):
            blocks.append("<h2>הכרזות</h2>")
            blocks.append(f"<p>{escape(payload['announcements']).replace(chr(10), '<br>')}</p>")

        body = "\n".join(blocks)
        page_style = (
            "@page { size: A4; margin: 18mm; }"
            " body { font-family: 'Heebo', Arial, sans-serif; direction: rtl;"
            " color: #2E3A59; max-width: 210mm; margin: 0 auto; }"
            " h1 { color: #2E3A59; } h2 { color: #C5A059; }"
        )
        if printable:
            return (
                "<!DOCTYPE html><html lang='he' dir='rtl'><head>"
                "<meta charset='utf-8'><title>לוח שבועי</title>"
                f"<style>{page_style}</style></head><body>{body}</body></html>"
            )
        return (
            "<div dir='rtl' style=\"font-family:'Heebo',Arial,sans-serif;color:#2E3A59\">"
            f"{body}</div>"
        )

    async def get_bulletin(
        self,
        date_str: Optional[str] = None,
        sections: Optional[str] = None,
        *,
        actor: User,
    ) -> dict:
        require_service_operational(actor)
        try:
            anchor = date.fromisoformat(date_str) if date_str else date.today()
        except ValueError as exc:
            raise ValueError(f"Invalid date: {date_str}") from exc

        week_sunday = _week_sunday(anchor)
        friday = week_sunday + timedelta(days=5)
        saturday = week_sunday + timedelta(days=6)
        config = self._get_or_create_config()
        resolved_sections = self._resolve_sections(week_sunday.isoformat(), sections, config)

        with get_session() as session:
            tenant = session.get(TenantConfig, 1) or TenantConfig()

        weekly = await prayer_schedule_service.generate_weekly(week_sunday.isoformat())
        shabbat = await get_full_shabbat_info(friday)
        azkarot = self._week_azkarot(week_sunday) if "azkarot" in resolved_sections else []
        smachot = self._week_smachot(week_sunday) if "smachot" in resolved_sections else []

        payload = {
            "week_start": week_sunday.isoformat(),
            "shabbat_date": saturday.isoformat(),
            "synagogue_name": tenant.synagogue_name,
            "rabbi": config.rabbi,
            "address": config.address,
            "announcements": config.announcements,
            "parasha": shabbat.get("parasha_he") or "",
            "special_shabbat": shabbat.get("special_shabbat_he") or "",
            "candle_lighting": shabbat.get("candle_lighting") or "",
            "havdalah": shabbat.get("havdalah") or "",
            "prayer_text": weekly.get("text") or "",
            "azkarot": azkarot,
            "smachot": smachot,
            "sections": resolved_sections,
        }
        payload["formats"] = {
            "whatsapp": self._render_whatsapp(payload, resolved_sections),
            "html": self._render_html(payload, resolved_sections, printable=False),
            "print_html": self._render_html(payload, resolved_sections, printable=True),
        }
        return payload


bulletin_service = BulletinService()
