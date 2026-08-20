"""Tests for prayer-schedule CRUD, day-type detection, and anchor math.

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


# ── CRUD ──────────────────────────────────────────────────────────────────────

async def test_create_and_list_prayer_rule(client):
    r = await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "מנחה",
        "day_type": "daily",
        "anchor": "sunset",
        "offset_minutes": -15,
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["name"] == "מנחה"
    assert data["offset_minutes"] == -15

    listed = await client.get("/api/v1/synagogue/prayer-rules?day_type=daily")
    assert listed.status_code == 200
    assert listed.json()["data"]["total"] == 1


async def test_update_and_delete_prayer_rule(client):
    created = await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "שחרית",
        "day_type": "daily",
        "anchor": "sunrise",
        "offset_minutes": 0,
    })
    rule_id = created.json()["data"]["id"]

    updated = await client.patch(
        f"/api/v1/synagogue/prayer-rules/{rule_id}",
        json={"offset_minutes": 10, "notes": "אחרי הנץ"},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["offset_minutes"] == 10
    assert updated.json()["data"]["notes"] == "אחרי הנץ"

    deleted = await client.delete(f"/api/v1/synagogue/prayer-rules/{rule_id}")
    assert deleted.status_code == 200
    listed = await client.get("/api/v1/synagogue/prayer-rules")
    assert listed.json()["data"]["total"] == 0


async def test_reorder_prayer_rules(client):
    first = await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "שחרית", "day_type": "daily", "anchor": "sunrise", "display_order": 0,
    })
    second = await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "מנחה", "day_type": "daily", "anchor": "sunset", "display_order": 1,
    })
    id_a = first.json()["data"]["id"]
    id_b = second.json()["data"]["id"]

    r = await client.post("/api/v1/synagogue/prayer-rules/reorder", json={
        "day_type": "daily",
        "ordered_ids": [id_b, id_a],
    })
    assert r.status_code == 200
    rules = (await client.get("/api/v1/synagogue/prayer-rules?day_type=daily")).json()["data"]["rules"]
    assert [rule["id"] for rule in rules] == [id_b, id_a]


# ── Special days ──────────────────────────────────────────────────────────────

async def test_special_day_crud(client):
    created = await client.post("/api/v1/synagogue/special-days", json={
        "name": "יום ירושלים",
        "hebrew_month": 2,
        "hebrew_day": 28,
        "notes": "תפילת הלל",
    })
    assert created.status_code == 201
    day_id = created.json()["data"]["id"]

    listed = await client.get("/api/v1/synagogue/special-days")
    assert listed.json()["data"]["total"] == 1

    deleted = await client.delete(f"/api/v1/synagogue/special-days/{day_id}")
    assert deleted.status_code == 200
    listed = await client.get("/api/v1/synagogue/special-days")
    assert listed.json()["data"]["total"] == 0


# ── Anchor math ───────────────────────────────────────────────────────────────

async def test_sunset_offset_is_applied(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "מנחה",
        "day_type": "daily",
        "anchor": "sunset",
        "offset_minutes": -15,
    })
    # Monday 2026-08-17 is a weekday (not Shabbat / Yom Tov)
    r = await client.get("/api/v1/synagogue/schedule?date=2026-08-17")
    assert r.status_code == 200
    prayers = r.json()["data"]["prayers"]
    assert len(prayers) == 1
    assert prayers[0]["calculated_time"] == "18:15"


async def test_no_auto_time_hides_calculated_time(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "שיעור הלכה",
        "day_type": "daily",
        "anchor": "sunset",
        "no_auto_time": True,
        "is_lesson": True,
        "notes": "אחרי ערבית",
    })
    r = await client.get("/api/v1/synagogue/schedule?date=2026-08-17")
    assert r.json()["data"]["prayers"][0]["calculated_time"] is None


async def test_fixed_anchor_uses_exact_time(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "שחרית",
        "day_type": "daily",
        "anchor": "fixed",
        "exact_time": "06:45",
    })
    r = await client.get("/api/v1/synagogue/schedule?date=2026-08-17")
    assert r.json()["data"]["prayers"][0]["calculated_time"] == "06:45"


async def test_saturday_candle_lighting_uses_friday(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "קבלת שבת",
        "day_type": "shabbat",
        "anchor": "candle_lighting",
        "offset_minutes": -20,
    })
    # 2026-08-22 is Saturday
    r = await client.get("/api/v1/synagogue/schedule?date=2026-08-22")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["day_type"] == "shabbat"
    assert data["prayers"][0]["calculated_time"] == "17:52"


async def test_saturday_havdalah_anchor(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "ערבית מוצאי שבת",
        "day_type": "shabbat",
        "anchor": "havdalah",
        "offset_minutes": 0,
    })
    r = await client.get("/api/v1/synagogue/schedule?date=2026-08-22")
    assert r.json()["data"]["prayers"][0]["calculated_time"] == "19:15"


async def test_yom_kippur_day_type(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "כל נדרי",
        "day_type": "yom_kippur",
        "anchor": "sunset",
        "offset_minutes": -20,
    })
    # 10 Tishrei 5786 = 2025-10-02
    r = await client.get("/api/v1/synagogue/schedule?date=2025-10-02")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["day_type"] == "yom_kippur"
    assert data["prayers"][0]["name"] == "כל נדרי"
    assert data["prayers"][0]["calculated_time"] == "18:10"


async def test_week_schedule_returns_seven_days(client):
    r = await client.get("/api/v1/synagogue/schedule/week?from_date=2026-08-16")
    assert r.status_code == 200
    days = r.json()["data"]["days"]
    assert len(days) == 7
    assert days[0]["date"] == "2026-08-16"
    assert days[6]["date"] == "2026-08-22"


async def test_generate_weekly_includes_parasha(client):
    await client.post("/api/v1/synagogue/prayer-rules", json={
        "name": "מנחה",
        "day_type": "shabbat",
        "anchor": "sunset",
        "offset_minutes": -20,
    })
    r = await client.get("/api/v1/synagogue/schedule/generate?week_start=2026-08-16")
    assert r.status_code == 200
    data = r.json()["data"]
    assert "בראשית" in data["text"]
    assert data["week_start"] == "2026-08-16"
    assert data["shabbat_date"] == "2026-08-22"


async def test_invalid_schedule_date_returns_400(client):
    r = await client.get("/api/v1/synagogue/schedule?date=not-a-date")
    assert r.status_code == 400
