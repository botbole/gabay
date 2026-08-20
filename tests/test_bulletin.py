"""Tests for the weekly bulletin module.

Hebcal is mocked — tests never hit the live zmanim API.
"""

from datetime import date

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")

MOCK_ZMANIM = {
    "city": "חיפה",
    "alot_hashachar": "04:30",
    "sunrise": "06:00",
    "chatzot": "12:30",
    "mincha_gedola": "13:00",
    "plag_hamincha": "17:00",
    "sunset": "18:30",
    "tzeit_hakochavim": "19:00",
    "candle_lighting": "18:12",
    "havdalah": "19:15",
    "parasha_he": "בראשית",
}


async def _fake_get_day_times(d: date) -> dict:
    return {"gregorian_date": d.isoformat(), **MOCK_ZMANIM}


async def _fake_get_full_shabbat_info(friday: date) -> dict:
    return {
        "candle_lighting": "18:12",
        "havdalah": "19:15",
        "parasha_he": "בראשית",
        "special_shabbat_he": None,
    }


@pytest.fixture(autouse=True)
def mock_hebcal(monkeypatch):
    monkeypatch.setattr(
        "app.modules.prayer_schedule.service.get_day_times",
        _fake_get_day_times,
    )
    monkeypatch.setattr(
        "app.modules.prayer_schedule.service.get_full_shabbat_info",
        _fake_get_full_shabbat_info,
    )
    monkeypatch.setattr(
        "app.modules.bulletin.service.get_full_shabbat_info",
        _fake_get_full_shabbat_info,
    )


async def _seed_week_data(client) -> dict:
    congregant = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "משה",
        "last_name": "כהן",
        "phone": "0501234567",
    })
    cid = congregant.json()["data"]["id"]

    heb = await client.get(
        "/api/v1/synagogue/calendar/gregorian-to-hebrew?date=2026-08-18"
    )
    hebrew = heb.json()["data"]

    await client.post("/api/v1/synagogue/azkarot", json={
        "congregant_id": cid,
        "deceased_name": "יעקב כהן",
        "relation": "father",
        "hebrew_day": hebrew["day"],
        "hebrew_month": hebrew["month"],
    })
    await client.post("/api/v1/synagogue/smachot", json={
        "congregant_id": cid,
        "occasion_type": "bar_mitzvah",
        "description": "הבן הבכור",
        "hebrew_day": hebrew["day"],
        "hebrew_month": hebrew["month"],
    })
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "מנחה",
        "day_type": "shabbat",
        "anchor": "sunset",
        "offset_minutes": -15,
    })
    await client.patch("/api/v1/synagogue/bulletin/config", json={
        "rabbi": "הרב לוי",
        "address": "רחוב הרצל 1",
        "announcements": "קידוש לאחר התפילה",
    })
    return {"congregant_id": cid, "hebrew": hebrew}


async def test_bulletin_includes_parasha_times_azkarot_smachot(client):
    await _seed_week_data(client)
    r = await client.get("/api/v1/synagogue/bulletin?date=2026-08-16")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["week_start"] == "2026-08-16"
    assert data["shabbat_date"] == "2026-08-22"
    assert data["parasha"] == "בראשית"
    assert data["candle_lighting"] == "18:12"
    assert data["havdalah"] == "19:15"
    assert data["rabbi"] == "הרב לוי"
    assert len(data["azkarot"]) == 1
    assert data["azkarot"][0]["deceased_name"] == "יעקב כהן"
    assert "wa.me" in data["azkarot"][0]["whatsapp_url"]
    assert len(data["smachot"]) == 1
    assert data["smachot"][0]["occasion_label"] == "בר מצוה"

    whatsapp = data["formats"]["whatsapp"]
    html = data["formats"]["html"]
    print_html = data["formats"]["print_html"]
    assert "בראשית" in whatsapp
    assert "הדלקת נרות: 18:12" in whatsapp
    assert "יעקב כהן" in whatsapp
    assert "בר מצוה" in whatsapp
    assert "קידוש לאחר התפילה" in whatsapp
    assert "מנחה" in whatsapp
    assert "בראשית" in html
    assert "יעקב כהן" in html
    assert "<!DOCTYPE html>" in print_html
    assert "A4" in print_html


async def test_omitted_sections_are_absent_from_payload_and_formats(client):
    await _seed_week_data(client)
    r = await client.get(
        "/api/v1/synagogue/bulletin?date=2026-08-16&sections=times,prayers"
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["azkarot"] == []
    assert data["smachot"] == []
    assert "azkarot" not in data["sections"]
    assert "אזכרות השבוע" not in data["formats"]["whatsapp"]
    assert "שמחות השבוע" not in data["formats"]["whatsapp"]
    assert "הכרזות" not in data["formats"]["whatsapp"]
    assert "בראשית" in data["formats"]["whatsapp"]


async def test_week_override_persists_sections(client):
    await _seed_week_data(client)
    saved = await client.put("/api/v1/synagogue/bulletin/week", json={
        "week_start": "2026-08-16",
        "sections": ["times", "announcements"],
    })
    assert saved.status_code == 200

    r = await client.get("/api/v1/synagogue/bulletin?date=2026-08-16")
    data = r.json()["data"]
    assert set(data["sections"]) == {"times", "announcements"}
    assert "קידוש לאחר התפילה" in data["formats"]["whatsapp"]
    assert "אזכרות השבוע" not in data["formats"]["whatsapp"]


async def test_bulletin_config_roundtrip(client):
    r = await client.patch("/api/v1/synagogue/bulletin/config", json={
        "rabbi": "הרב כהן",
        "address": "רחוב יפו 10",
        "announcements": "שיעור בערב",
    })
    assert r.status_code == 200
    got = await client.get("/api/v1/synagogue/bulletin/config")
    data = got.json()["data"]
    assert data["rabbi"] == "הרב כהן"
    assert data["address"] == "רחוב יפו 10"
    assert data["announcements"] == "שיעור בערב"
    assert "times" in data["available_sections"]


async def test_invalid_bulletin_date_returns_400(client):
    r = await client.get("/api/v1/synagogue/bulletin?date=not-a-date")
    assert r.status_code == 400
