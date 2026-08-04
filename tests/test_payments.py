"""Tests for payment / donation endpoints."""

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")


# ── Record Payment ────────────────────────────────────────────────────────────

async def test_record_payment(client, congregant):
    print("\n💰 רישום תשלום תרומה עם כל הפרטים")
    r = await client.post("/api/v1/synagogue/payments", json={
        "congregant_id": congregant["id"],
        "amount": 200.0,
        "purpose": "donation",
        "currency": "ILS",
        "notes": "תרומה לכבוד שבת",
        "payment_date": "2026-01-15",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["amount"] == 200.0
    assert data["purpose"] == "donation"
    assert data["congregant_id"] == congregant["id"]


async def test_record_multiple_payments(client, congregant):
    print("\n💰 רישום 3 תשלומים שונים – בדיקת סכום כולל ופירוט לפי מטרה")
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 100, "purpose": "aliya"})
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 50,  "purpose": "kiddush"})
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 200, "purpose": "annual_dues"})

    r = await client.get(f"/api/v1/synagogue/payments/{cid}/history")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total_paid"] == 350.0
    assert len(data["payments"]) == 3
    assert data["by_purpose"]["aliya"] == 100.0


# ── Payment History ───────────────────────────────────────────────────────────

async def test_payment_history_empty(client, congregant):
    print("\n💰 היסטוריית תשלומים ריקה למתפלל חדש")
    r = await client.get(f"/api/v1/synagogue/payments/{congregant['id']}/history")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total_paid"] == 0
    assert data["payments"] == []


# ── All Payments ──────────────────────────────────────────────────────────────

async def test_get_all_payments(client, congregant):
    print("\n💰 שליפת כל התשלומים – בדיקת מספר רשומות וסכום כולל")
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 100, "purpose": "donation"})
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 50,  "purpose": "aliya"})

    r = await client.get("/api/v1/synagogue/payments")
    data = r.json()["data"]
    assert data["total_records"] == 2
    assert data["total_amount"] == 150.0


async def test_filter_payments_by_purpose(client, congregant):
    print("\n💰 סינון תשלומים לפי מטרה – רק תרומות")
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 100, "purpose": "donation"})
    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 50,  "purpose": "aliya"})

    r = await client.get("/api/v1/synagogue/payments?purpose=donation")
    data = r.json()["data"]
    assert data["total_records"] == 1
    assert data["payments"][0]["purpose"] == "donation"


# ── Pending Payments ──────────────────────────────────────────────────────────

async def test_pending_payments(client):
    print("\n💰 רשימת ממתינים לתשלום – מתפלל שלא שילם מופיע, המשלם לא")
    r1 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "א", "last_name": "ב"})
    r2 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "ג", "last_name": "ד"})
    cid1 = r1.json()["data"]["id"]

    await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid1, "amount": 100, "purpose": "donation"})

    r = await client.get("/api/v1/synagogue/payments/pending")
    data = r.json()["data"]
    assert data["total_pending"] == 1
    assert data["congregants"][0]["id"] == r2.json()["data"]["id"]


# ── Bulk Delete ───────────────────────────────────────────────────────────────

async def test_bulk_delete_payments(client, congregant):
    print("\n💰 מחיקה מרובה של תשלום – הרשימה מתרוקנת")
    cid = congregant["id"]
    r = await client.post("/api/v1/synagogue/payments", json={"congregant_id": cid, "amount": 100, "purpose": "donation"})
    pid = r.json()["data"]["id"]

    r = await client.post("/api/v1/synagogue/payments/bulk-delete", json={"ids": [pid]})
    assert r.json()["data"]["deleted"] == 1

    r = await client.get("/api/v1/synagogue/payments")
    assert r.json()["data"]["total_records"] == 0
