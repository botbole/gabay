"""Tests for seating / places endpoints."""

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")


# ── Create Place ──────────────────────────────────────────────────────────────

async def test_create_place(client):
    print("\n🪑 יצירת מושב חדש – אגף ראשי, שורה א, מושב 5")
    r = await client.post("/api/v1/synagogue/places", json={
        "section": "main",
        "row": "A",
        "place_number": 5,
        "is_reserved": False,
        "annual_fee": 0,
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["section"] == "main"
    assert data["row"] == "A"
    assert data["place_number"] == 5
    assert data["congregant_id"] is None


# ── List Places ───────────────────────────────────────────────────────────────

async def test_list_places(client):
    print("\n🪑 רשימת כל המושבים – 2 מושבים ב-2 אגפים שונים")
    await client.post("/api/v1/synagogue/places", json={"section": "main",    "row": "A", "place_number": 1})
    await client.post("/api/v1/synagogue/places", json={"section": "balcony", "row": "B", "place_number": 1})

    r = await client.get("/api/v1/synagogue/places")
    assert r.json()["data"]["total"] == 2


async def test_filter_places_by_section(client):
    print("\n🪑 סינון מושבים לפי אגף – רק האגף הראשי")
    await client.post("/api/v1/synagogue/places", json={"section": "main",    "row": "A", "place_number": 1})
    await client.post("/api/v1/synagogue/places", json={"section": "balcony", "row": "B", "place_number": 1})

    r = await client.get("/api/v1/synagogue/places?section=main")
    assert r.json()["data"]["total"] == 1


async def test_filter_only_free_places(client, congregant):
    print("\n🪑 סינון מושבים פנויים – מושב תפוס לא מופיע")
    r1 = await client.post("/api/v1/synagogue/places", json={"section": "main", "row": "A", "place_number": 1})
    r2 = await client.post("/api/v1/synagogue/places", json={"section": "main", "row": "A", "place_number": 2})
    pid1 = r1.json()["data"]["id"]

    await client.patch(f"/api/v1/synagogue/places/{pid1}/assign", json={"congregant_id": congregant["id"]})

    r = await client.get("/api/v1/synagogue/places?only_free=true")
    data = r.json()["data"]
    assert data["total"] == 1
    assert data["places"][0]["id"] == r2.json()["data"]["id"]


# ── Assign / Unassign ─────────────────────────────────────────────────────────

async def test_assign_and_unassign_place(client, congregant):
    print("\n🪑 שיוך מושב למתפלל → בדיקה → ביטול שיוך → 404")
    r = await client.post("/api/v1/synagogue/places", json={"section": "main", "row": "A", "place_number": 3})
    pid = r.json()["data"]["id"]
    cid = congregant["id"]

    r = await client.patch(f"/api/v1/synagogue/places/{pid}/assign", json={
        "congregant_id": cid,
        "is_reserved": True,
        "annual_fee": 500.0,
    })
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["congregant_id"] == cid
    assert data["annual_fee"] == 500.0

    r = await client.get(f"/api/v1/synagogue/congregants/{cid}/place")
    assert r.status_code == 200
    assert r.json()["data"]["id"] == pid

    r = await client.patch(f"/api/v1/synagogue/places/{pid}/unassign")
    assert r.status_code == 200
    assert r.json()["data"]["congregant_id"] is None

    r = await client.get(f"/api/v1/synagogue/congregants/{cid}/place")
    assert r.status_code == 404


# ── Get Place ─────────────────────────────────────────────────────────────────

async def test_get_place(client):
    print("\n🪑 שליפת מושב לפי ID")
    r = await client.post("/api/v1/synagogue/places", json={"section": "east", "row": "C", "place_number": 10})
    pid = r.json()["data"]["id"]

    r = await client.get(f"/api/v1/synagogue/places/{pid}")
    assert r.status_code == 200
    assert r.json()["data"]["row"] == "C"


async def test_get_place_not_found(client):
    print("\n🪑 שליפת מושב עם ID לא קיים – מצפה לשגיאת 404")
    r = await client.get("/api/v1/synagogue/places/nonexistent")
    assert r.status_code == 404


# ── Bulk Delete ───────────────────────────────────────────────────────────────

async def test_bulk_delete_places(client):
    print("\n🪑 מחיקה מרובה של מושב")
    r = await client.post("/api/v1/synagogue/places", json={"section": "main", "row": "A", "place_number": 99})
    pid = r.json()["data"]["id"]

    r = await client.post("/api/v1/synagogue/places/bulk-delete", json={"ids": [pid]})
    assert r.json()["data"]["deleted"] == 1
