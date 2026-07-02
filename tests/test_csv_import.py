"""Tests for bulk CSV / Sheets import of congregants."""

import io


def _csv_file(content: str):
    return ("file", (io.BytesIO(content.encode("utf-8")), "text/csv"))


# ── Basic Import ──────────────────────────────────────────────────────────────

async def test_import_csv_english_headers(client):
    print("\n📂 ייבוא CSV עם כותרות באנגלית – 2 מתפללים נוצרים")
    csv_content = "first_name,last_name,phone,member_type\nמשה,כהן,050-1111111,regular\nאברהם,לוי,052-2222222,guest\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["created"] == 2
    assert data["skipped"] == []
    assert data["errors"] == []


async def test_import_csv_hebrew_headers(client):
    print("\n📂 ייבוא CSV עם כותרות בעברית – 2 מתפללים נוצרים")
    csv_content = "שם פרטי,שם משפחה,טלפון\nיוסף,ישראל,054-3333333\nרחל,שמיר,\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["created"] == 2


async def test_import_csv_with_kohen_levi_column(client):
    print("\n📂 ייבוא CSV עם עמודת כהן/לוי/ישראל – דגלים מוגדרים נכון")
    csv_content = "שם פרטי,שם משפחה,כהן/לוי/ישראל\nאהרן,כהן,כהן\nשמואל,לוי,לוי\nדוד,ישראל,ישראל\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["created"] == 3

    r2 = await client.get("/api/v1/synagogue/congregants")
    congregants = {c["last_name"]: c for c in r2.json()["data"]["congregants"]}
    assert congregants["כהן"]["is_kohen"] is True
    assert congregants["כהן"]["is_levi"] is False
    assert congregants["לוי"]["is_levi"] is True
    assert congregants["ישראל"]["is_kohen"] is False
    assert congregants["ישראל"]["is_levi"] is False


# ── Missing Required Fields ───────────────────────────────────────────────────

async def test_import_csv_skips_missing_name(client):
    print("\n📂 ייבוא CSV עם שורות חסרות שם – שורות חסרות מדולגות")
    csv_content = "first_name,last_name\nמשה,כהן\n,לוי\nאברהם,\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201
    data = r.json()["data"]
    assert data["created"] == 1
    assert len(data["skipped"]) == 2


# ── Auto-create Azkara / Simcha ───────────────────────────────────────────────

async def test_import_csv_creates_azkara(client):
    print("\n📂 ייבוא CSV עם תאריך אזכרת אבא – אזכרה נוצרת אוטומטית")
    csv_content = "שם פרטי,שם משפחה,אזכרה אבא\nדוד,לוי,15/01/2000\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201
    cid = r.json()["data"]["records"][0]["id"]

    r2 = await client.get(f"/api/v1/synagogue/azkarot?congregant_id={cid}")
    azkarot = r2.json()["data"]["azkarot"]
    assert len(azkarot) == 1
    assert azkarot[0]["relation"] == "father"


async def test_import_csv_creates_birthday_simcha(client):
    print("\n📂 ייבוא CSV עם תאריך לידה – שמחת יום הולדת נוצרת אוטומטית")
    csv_content = "שם פרטי,שם משפחה,תאריך לידה\nשרה,כהן,20/03/1990\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201
    cid = r.json()["data"]["records"][0]["id"]

    r2 = await client.get(f"/api/v1/synagogue/smachot?congregant_id={cid}")
    smachot = r2.json()["data"]["smachot"]
    assert len(smachot) == 1
    assert smachot[0]["occasion_type"] == "birthday"


# ── Empty / Invalid CSV ───────────────────────────────────────────────────────

async def test_import_empty_csv(client):
    print("\n📂 ייבוא קובץ CSV ריק – מצפה לשגיאת 400")
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert r.status_code == 400


async def test_import_csv_only_headers(client):
    print("\n📂 ייבוא CSV עם כותרות בלבד ללא שורות נתונים – 0 נוצרו")
    csv_content = "first_name,last_name\n"
    r = await client.post(
        "/api/v1/synagogue/congregants/bulk/csv",
        files={"file": ("headers_only.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert r.status_code in (400, 201)
    if r.status_code == 201:
        assert r.json()["data"]["created"] == 0
