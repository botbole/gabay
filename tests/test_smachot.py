"""Tests for Simcha (lifecycle celebrations) endpoints."""


# ── Create Simcha ─────────────────────────────────────────────────────────────

async def test_create_simcha_birthday(client, congregant):
    print("\n🎉 יצירת שמחת יום הולדת מתאריך גרגוריאני – מחשב תאריך עברי")
    r = await client.post("/api/v1/synagogue/smachot", json={
        "congregant_id": congregant["id"],
        "occasion_type": "birthday",
        "gregorian_date": "1985-05-20",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["occasion_type"] == "birthday"
    assert data["hebrew_day"] > 0
    assert data["year_occurred"] == 1985


async def test_create_simcha_bar_mitzvah(client, congregant):
    print("\n🎉 יצירת שמחת בר מצווה עם פרשה")
    r = await client.post("/api/v1/synagogue/smachot", json={
        "congregant_id": congregant["id"],
        "occasion_type": "bar_mitzvah",
        "parasha": "לך לך",
        "gregorian_date": "1998-10-31",
        "description": "בר מצווה",
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["parasha"] == "לך לך"
    assert data["occasion_type"] == "bar_mitzvah"


async def test_create_simcha_hebrew_date_only(client, congregant):
    print("\n🎉 יצירת שמחת יום נישואין עם תאריך עברי בלבד")
    r = await client.post("/api/v1/synagogue/smachot", json={
        "congregant_id": congregant["id"],
        "occasion_type": "anniversary",
        "hebrew_day": 15,
        "hebrew_month": 1,
    })
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["hebrew_day"] == 15
    assert data["hebrew_month"] == 1


# ── List / Filter ─────────────────────────────────────────────────────────────

async def test_list_smachot(client, congregant):
    print("\n🎉 רשימת כל השמחות – 2 שמחות מסוגים שונים")
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/smachot", json={"congregant_id": cid, "occasion_type": "birthday",  "hebrew_day": 1, "hebrew_month": 1})
    await client.post("/api/v1/synagogue/smachot", json={"congregant_id": cid, "occasion_type": "bar_mitzvah", "hebrew_day": 2, "hebrew_month": 2})

    r = await client.get("/api/v1/synagogue/smachot")
    assert r.json()["data"]["total"] == 2


async def test_list_smachot_by_congregant(client):
    print("\n🎉 סינון שמחות לפי מתפלל – כל מתפלל רואה רק את שלו")
    r1 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "א", "last_name": "ב"})
    r2 = await client.post("/api/v1/synagogue/congregants", json={"first_name": "ג", "last_name": "ד"})
    cid1 = r1.json()["data"]["id"]
    cid2 = r2.json()["data"]["id"]

    await client.post("/api/v1/synagogue/smachot", json={"congregant_id": cid1, "occasion_type": "birthday", "hebrew_day": 1, "hebrew_month": 1})
    await client.post("/api/v1/synagogue/smachot", json={"congregant_id": cid2, "occasion_type": "birthday", "hebrew_day": 2, "hebrew_month": 2})

    r = await client.get(f"/api/v1/synagogue/smachot?congregant_id={cid1}")
    assert r.json()["data"]["total"] == 1


async def test_list_smachot_by_type(client, congregant):
    print("\n🎉 סינון שמחות לפי סוג – רק ימי הולדת")
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/smachot", json={"congregant_id": cid, "occasion_type": "birthday",    "hebrew_day": 1, "hebrew_month": 1})
    await client.post("/api/v1/synagogue/smachot", json={"congregant_id": cid, "occasion_type": "anniversary", "hebrew_day": 2, "hebrew_month": 2})

    r = await client.get("/api/v1/synagogue/smachot?occasion_type=birthday")
    assert r.json()["data"]["total"] == 1


# ── Get / Delete ──────────────────────────────────────────────────────────────

async def test_get_and_delete_simcha(client, congregant):
    print("\n🎉 שליפה ומחיקה של שמחה – אחרי מחיקה מחזיר 404")
    r = await client.post("/api/v1/synagogue/smachot", json={
        "congregant_id": congregant["id"],
        "occasion_type": "brit",
        "hebrew_day": 8,
        "hebrew_month": 7,
    })
    sid = r.json()["data"]["id"]

    r = await client.get(f"/api/v1/synagogue/smachot/{sid}")
    assert r.status_code == 200
    assert r.json()["data"]["occasion_type"] == "brit"

    r = await client.delete(f"/api/v1/synagogue/smachot/{sid}")
    assert r.status_code == 200

    r = await client.get(f"/api/v1/synagogue/smachot/{sid}")
    assert r.status_code == 404


# ── Bulk Delete ───────────────────────────────────────────────────────────────

async def test_bulk_delete_smachot(client, congregant):
    print("\n🎉 מחיקה מרובה של שמחה")
    r = await client.post("/api/v1/synagogue/smachot", json={
        "congregant_id": congregant["id"],
        "occasion_type": "other",
        "hebrew_day": 1,
        "hebrew_month": 1,
    })
    sid = r.json()["data"]["id"]

    r = await client.post("/api/v1/synagogue/smachot/bulk-delete", json={"ids": [sid]})
    assert r.json()["data"]["deleted"] == 1


# ── Upcoming ──────────────────────────────────────────────────────────────────

async def test_upcoming_smachot_returns_list(client):
    print("\n🎉 שמחות קרובות – בודק שמבנה התשובה תקין")
    r = await client.get("/api/v1/synagogue/smachot/upcoming?days_ahead=365")
    assert r.status_code == 200
    data = r.json()["data"]
    assert "total" in data
    assert "smachot" in data
