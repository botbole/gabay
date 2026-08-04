"""Tests for congregant management endpoints."""

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")


# ── Create ────────────────────────────────────────────────────────────────────

async def test_create_congregant_minimal(client):
    print("\n📋 יוצר מתפלל עם שדות בסיסיים בלבד (שם פרטי + משפחה)")
    r = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "אברהם",
        "last_name": "לוי",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["first_name"] == "אברהם"
    assert data["last_name"] == "לוי"
    assert data["id"]


async def test_create_congregant_full(client):
    print("\n📋 יוצר מתפלל עם כל השדות (שם עברי, טלפון, מייל, סוג חברות)")
    r = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "יוסף",
        "last_name": "ישראל",
        "hebrew_name": "יוסף בן יעקב",
        "phone": "050-1234567",
        "email": "yosef@example.com",
        "is_kohen": False,
        "is_levi": False,
        "member_type": "regular",
        "notes": "מתפלל ותיק",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["hebrew_name"] == "יוסף בן יעקב"
    assert data["phone"] == "050-1234567"
    assert data["member_type"] == "regular"


async def test_create_kohen(client):
    print("\n📋 יוצר מתפלל עם סימון כהן – בודק שהדגל נשמר")
    r = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "אהרן",
        "last_name": "כהן",
        "is_kohen": True,
    })
    assert r.status_code == 201
    assert r.json()["data"]["is_kohen"] is True


# ── List ──────────────────────────────────────────────────────────────────────

async def test_list_congregants_empty(client):
    print("\n📋 מחזיר רשימה ריקה כשאין מתפללים")
    r = await client.get("/api/v1/synagogue/congregants")
    assert r.status_code == 200
    assert r.json()["data"]["total"] == 0


async def test_list_congregants(client, congregant):
    print("\n📋 מחזיר רשימה עם מתפלל אחד שנוצר")
    r = await client.get("/api/v1/synagogue/congregants")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["total"] == 1
    assert data["congregants"][0]["id"] == congregant["id"]


async def test_list_filter_by_type(client):
    print("\n📋 סינון לפי סוג חברות – קבוע vs. אורח")
    await client.post("/api/v1/synagogue/congregants", json={"first_name": "א", "last_name": "ב", "member_type": "regular"})
    await client.post("/api/v1/synagogue/congregants", json={"first_name": "ג", "last_name": "ד", "member_type": "guest"})

    r = await client.get("/api/v1/synagogue/congregants?member_type=regular")
    assert r.json()["data"]["total"] == 1

    r = await client.get("/api/v1/synagogue/congregants?member_type=guest")
    assert r.json()["data"]["total"] == 1


# ── Get ───────────────────────────────────────────────────────────────────────

async def test_get_congregant(client, congregant):
    print("\n📋 שליפת מתפלל לפי ID")
    r = await client.get(f"/api/v1/synagogue/congregants/{congregant['id']}")
    assert r.status_code == 200
    assert r.json()["data"]["id"] == congregant["id"]


async def test_get_congregant_not_found(client):
    print("\n📋 שליפת מתפלל עם ID לא קיים – מצפה לשגיאת 404")
    r = await client.get("/api/v1/synagogue/congregants/nonexistent-id")
    assert r.status_code == 404


# ── Update ────────────────────────────────────────────────────────────────────

async def test_update_congregant(client, congregant):
    print("\n📋 עדכון טלפון והערות של מתפלל קיים")
    r = await client.patch(f"/api/v1/synagogue/congregants/{congregant['id']}", json={
        "phone": "052-9999999",
        "notes": "עודכן",
    })
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["phone"] == "052-9999999"
    assert data["notes"] == "עודכן"


async def test_update_no_fields(client, congregant):
    print("\n📋 עדכון ללא שדות – מצפה לשגיאת 400")
    r = await client.patch(f"/api/v1/synagogue/congregants/{congregant['id']}", json={})
    assert r.status_code == 400


# ── Archive / Restore ─────────────────────────────────────────────────────────

async def test_bulk_archive_and_restore(client, congregant):
    print("\n📋 ארכוב מתפלל → נעלם מרשימה פעילה → שחזור → חוזר לרשימה")
    cid = congregant["id"]

    r = await client.post("/api/v1/synagogue/congregants/bulk-archive", json={"ids": [cid]})
    assert r.status_code == 200
    assert r.json()["data"]["archived"] == 1

    r = await client.get("/api/v1/synagogue/congregants")
    assert r.json()["data"]["total"] == 0

    r = await client.get("/api/v1/synagogue/congregants?archived=true")
    assert r.json()["data"]["total"] == 1

    r = await client.post("/api/v1/synagogue/congregants/bulk-restore", json={"ids": [cid]})
    assert r.json()["data"]["restored"] == 1

    r = await client.get("/api/v1/synagogue/congregants")
    assert r.json()["data"]["total"] == 1


# ── Bulk Delete ───────────────────────────────────────────────────────────────

async def test_bulk_delete_congregants(client, congregant):
    print("\n📋 מחיקה מרובה של מתפלל – הרשימה מתרוקנת")
    cid = congregant["id"]
    r = await client.post("/api/v1/synagogue/congregants/bulk-delete", json={"ids": [cid]})
    assert r.status_code == 200
    assert r.json()["data"]["deleted"] == 1

    r = await client.get("/api/v1/synagogue/congregants")
    assert r.json()["data"]["total"] == 0


# ── Auto-create Azkara/Simcha on congregant creation ─────────────────────────

async def test_create_with_azkara_gregorian(client):
    print("\n📋 יצירת מתפלל עם תאריך פטירת אב → אזכרה נוצרת אוטומטית")
    r = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "דוד",
        "last_name": "לוי",
        "father_name": "יצחק",
        "azkara_father": "15/01/2000",
    })
    assert r.status_code == 201
    cid = r.json()["data"]["id"]

    r = await client.get(f"/api/v1/synagogue/azkarot?congregant_id={cid}")
    azkarot = r.json()["data"]["azkarot"]
    assert len(azkarot) == 1
    assert azkarot[0]["relation"] == "father"


async def test_create_with_simcha_birthday(client):
    print("\n📋 יצירת מתפלל עם תאריך לידה → שמחת יום הולדת נוצרת אוטומטית")
    r = await client.post("/api/v1/synagogue/congregants", json={
        "first_name": "רחל",
        "last_name": "שמיר",
        "birth_date": "15/03/1985",
    })
    assert r.status_code == 201
    cid = r.json()["data"]["id"]

    r = await client.get(f"/api/v1/synagogue/smachot?congregant_id={cid}")
    smachot = r.json()["data"]["smachot"]
    assert len(smachot) == 1
    assert smachot[0]["occasion_type"] == "birthday"
