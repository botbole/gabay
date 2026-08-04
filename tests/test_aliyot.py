"""Tests for Torah Aliya endpoints."""

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")


# ── Assign Aliya ──────────────────────────────────────────────────────────────

async def test_assign_aliya(client, congregant):
    print("\n📖 שיוך עלייה לתורה לכהן בפרשת בראשית")
    r = await client.post("/api/v1/synagogue/aliyot", json={
        "congregant_id": congregant["id"],
        "parasha": "בראשית",
        "aliya_type": "Kohen",
        "date_str": "2026-10-04",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["parasha"] == "בראשית"
    assert data["aliya_type"] == "Kohen"
    assert data["congregant_id"] == congregant["id"]


async def test_assign_aliya_with_donation_creates_payment(client, congregant):
    print("\n📖 עלייה עם נדבה – בודק שתשלום נוצר אוטומטית")
    await client.post("/api/v1/synagogue/aliyot", json={
        "congregant_id": congregant["id"],
        "parasha": "נח",
        "aliya_type": "Levi",
        "donation_amount": 150.0,
    })

    r = await client.get(f"/api/v1/synagogue/payments/{congregant['id']}/history")
    data = r.json()["data"]
    assert data["total_paid"] == 150.0
    assert data["payments"][0]["purpose"] == "aliya"


async def test_assign_aliya_no_donation_no_payment(client, congregant):
    print("\n📖 עלייה ללא נדבה – לא נוצר תשלום")
    await client.post("/api/v1/synagogue/aliyot", json={
        "congregant_id": congregant["id"],
        "parasha": "לך לך",
        "aliya_type": "Shlishi",
        "donation_amount": 0,
    })

    r = await client.get(f"/api/v1/synagogue/payments/{congregant['id']}/history")
    assert r.json()["data"]["total_paid"] == 0.0


# ── Aliya History ─────────────────────────────────────────────────────────────

async def test_aliya_history(client, congregant):
    print("\n📖 היסטוריית עליות של מתפלל – 2 עליות בפרשות שונות")
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/aliyot", json={"congregant_id": cid, "parasha": "בראשית", "aliya_type": "Kohen"})
    await client.post("/api/v1/synagogue/aliyot", json={"congregant_id": cid, "parasha": "נח",      "aliya_type": "Maftir"})

    r = await client.get(f"/api/v1/synagogue/aliyot/{cid}/history")
    data = r.json()["data"]
    assert data["total_aliyot"] == 2
    assert len(data["aliyot"]) == 2


async def test_aliya_history_empty(client, congregant):
    print("\n📖 היסטוריית עליות ריקה למתפלל חדש")
    r = await client.get(f"/api/v1/synagogue/aliyot/{congregant['id']}/history")
    assert r.json()["data"]["total_aliyot"] == 0


# ── List by Parasha ───────────────────────────────────────────────────────────

async def test_aliyot_by_parasha(client):
    print("\n📖 שליפת כל העולים לפרשת וירא – 2 עולים, פרשה אחרת לא מופיעה")
    r1 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "א", "last_name": "ב", "is_kohen": True})
    r2 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "ג", "last_name": "ד", "is_levi": True})
    cid1 = r1.json()["data"]["id"]
    cid2 = r2.json()["data"]["id"]

    await client.post("/api/v1/synagogue/aliyot", json={"congregant_id": cid1, "parasha": "וירא", "aliya_type": "Kohen"})
    await client.post("/api/v1/synagogue/aliyot", json={"congregant_id": cid2, "parasha": "וירא", "aliya_type": "Levi"})
    await client.post("/api/v1/synagogue/aliyot", json={"congregant_id": cid1, "parasha": "חיי שרה", "aliya_type": "Kohen"})

    r = await client.get("/api/v1/synagogue/aliyot/parasha/וירא")
    data = r.json()["data"]
    assert data["total"] == 2
    assert data["parasha"] == "וירא"


# ── List All ──────────────────────────────────────────────────────────────────

async def test_list_aliyot(client, congregant):
    print("\n📖 רשימת כל העליות – עלייה אחת")
    await client.post("/api/v1/synagogue/aliyot", json={"congregant_id": congregant["id"], "parasha": "בראשית", "aliya_type": "Kohen"})

    r = await client.get("/api/v1/synagogue/aliyot")
    assert r.json()["data"]["total"] == 1


# ── Bulk Delete ───────────────────────────────────────────────────────────────

async def test_bulk_delete_aliyot(client, congregant):
    print("\n📖 מחיקה מרובה של עלייה – הרשימה מתרוקנת")
    r = await client.post("/api/v1/synagogue/aliyot", json={
        "congregant_id": congregant["id"],
        "parasha": "בראשית",
        "aliya_type": "Kohen",
    })
    aid = r.json()["data"]["id"]

    r = await client.post("/api/v1/synagogue/aliyot/bulk-delete", json={"ids": [aid]})
    assert r.json()["data"]["deleted"] == 1

    r = await client.get("/api/v1/synagogue/aliyot")
    assert r.json()["data"]["total"] == 0
