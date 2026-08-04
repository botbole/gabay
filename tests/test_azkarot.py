"""Tests for Azkara (yahrzeit) endpoints."""

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")


# ── Create Azkara ─────────────────────────────────────────────────────────────

async def test_create_azkara_gregorian(client, congregant):
    print("\n🕯️ יצירת אזכרה מתאריך גרגוריאני – מחשב תאריך עברי אוטומטית")
    r = await client.post("/api/v1/synagogue/azkarot", json={
        "congregant_id": congregant["id"],
        "deceased_name": "יעקב כהן",
        "deceased_hebrew_name": "יעקב בן אברהם",
        "relation": "father",
        "gregorian_date": "2010-03-15",
        "notes": "אב יקר",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["deceased_name"] == "יעקב כהן"
    assert data["relation"] == "father"
    assert data["hebrew_day"] > 0
    assert data["hebrew_month"] > 0
    assert data["year_occurred"] == 2010


async def test_create_azkara_hebrew_date_only(client, congregant):
    print("\n🕯️ יצירת אזכרה עם תאריך עברי בלבד (ללא גרגוריאני)")
    r = await client.post("/api/v1/synagogue/azkarot", json={
        "congregant_id": congregant["id"],
        "deceased_name": "שרה לוי",
        "relation": "mother",
        "hebrew_day": 10,
        "hebrew_month": 7,
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["hebrew_day"] == 10
    assert data["hebrew_month"] == 7


# ── List Azkarot ──────────────────────────────────────────────────────────────

async def test_list_azkarot(client, congregant):
    print("\n🕯️ רשימת כל האזכרות – אזכרה אחת")
    await client.post("/api/v1/synagogue/azkarot", json={
        "congregant_id": congregant["id"],
        "deceased_name": "יעקב",
        "relation": "father",
        "hebrew_day": 5,
        "hebrew_month": 1,
    })
    r = await client.get("/api/v1/synagogue/azkarot")
    assert r.json()["data"]["total"] == 1


async def test_list_azkarot_by_congregant(client):
    print("\n🕯️ סינון אזכרות לפי מתפלל – כל מתפלל רואה רק את שלו")
    r1 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "א", "last_name": "ב"})
    r2 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "ג", "last_name": "ד"})
    cid1 = r1.json()["data"]["id"]
    cid2 = r2.json()["data"]["id"]

    await client.post("/api/v1/synagogue/azkarot", json={"congregant_id": cid1, "deceased_name": "א", "hebrew_day": 1, "hebrew_month": 1})
    await client.post("/api/v1/synagogue/azkarot", json={"congregant_id": cid2, "deceased_name": "ב", "hebrew_day": 2, "hebrew_month": 2})

    r = await client.get(f"/api/v1/synagogue/azkarot?congregant_id={cid1}")
    assert r.json()["data"]["total"] == 1


# ── Get / Delete ──────────────────────────────────────────────────────────────

async def test_get_and_delete_azkara(client, congregant):
    print("\n🕯️ שליפה ומחיקה של אזכרה – אחרי מחיקה מחזיר 404")
    r = await client.post("/api/v1/synagogue/azkarot", json={
        "congregant_id": congregant["id"],
        "deceased_name": "מרדכי",
        "hebrew_day": 14,
        "hebrew_month": 12,
    })
    aid = r.json()["data"]["id"]

    r = await client.get(f"/api/v1/synagogue/azkarot/{aid}")
    assert r.status_code == 200
    assert r.json()["data"]["deceased_name"] == "מרדכי"

    r = await client.delete(f"/api/v1/synagogue/azkarot/{aid}")
    assert r.status_code == 200

    r = await client.get(f"/api/v1/synagogue/azkarot/{aid}")
    assert r.status_code == 404


# ── Bulk Delete ───────────────────────────────────────────────────────────────

async def test_bulk_delete_azkarot(client, congregant):
    print("\n🕯️ מחיקה מרובה של אזכרה")
    r = await client.post("/api/v1/synagogue/azkarot", json={
        "congregant_id": congregant["id"],
        "deceased_name": "טסט",
        "hebrew_day": 1,
        "hebrew_month": 1,
    })
    aid = r.json()["data"]["id"]

    r = await client.post("/api/v1/synagogue/azkarot/bulk-delete", json={"ids": [aid]})
    assert r.json()["data"]["deleted"] == 1


# ── Upcoming ──────────────────────────────────────────────────────────────────

async def test_upcoming_azkarot_returns_list(client, congregant):
    print("\n🕯️ אזכרות קרובות – בודק שמבנה התשובה תקין")
    r = await client.get("/api/v1/synagogue/azkarot/upcoming?days_ahead=365")
    assert r.status_code == 200
    data = r.json()["data"]
    assert "total" in data
    assert "azkarot" in data
