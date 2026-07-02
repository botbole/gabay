"""Tests for Hebrew ↔ Gregorian calendar utilities."""


# ── Gregorian → Hebrew ────────────────────────────────────────────────────────

async def test_gregorian_to_hebrew(client):
    print("\n📅 המרת תאריך גרגוריאני לעברי – ראש השנה תשפ\"ו")
    r = await client.get("/api/v1/synagogue/calendar/gregorian-to-hebrew?date=2025-09-23")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["day"] == 1
    assert data["month"] == 7   # Tishrei
    assert data["year"] == 5786


async def test_gregorian_to_hebrew_yom_kippur(client):
    print("\n📅 המרת תאריך גרגוריאני לעברי – יום כיפור תשפ\"ו")
    r = await client.get("/api/v1/synagogue/calendar/gregorian-to-hebrew?date=2025-10-02")
    data = r.json()["data"]
    assert data["day"] == 10
    assert data["month"] == 7   # 10 Tishrei


async def test_gregorian_to_hebrew_invalid(client):
    print("\n📅 המרת תאריך לא תקין – מצפה לשגיאה בתשובה")
    r = await client.get("/api/v1/synagogue/calendar/gregorian-to-hebrew?date=not-a-date")
    assert r.status_code == 200
    assert "error" in r.json()["data"]


# ── Hebrew → Gregorian ────────────────────────────────────────────────────────

async def test_hebrew_to_gregorian(client):
    print("\n📅 המרת תאריך עברי לגרגוריאני – א' תשרי תשפ\"ו = 23.09.2025")
    r = await client.get("/api/v1/synagogue/calendar/hebrew-to-gregorian?year=5786&month=7&day=1")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["gregorian"] == "2025-09-23"


async def test_hebrew_to_gregorian_passover(client):
    print("\n📅 המרת תאריך עברי לגרגוריאני – ט\"ו ניסן תשפ\"ו (ליל הסדר)")
    r = await client.get("/api/v1/synagogue/calendar/hebrew-to-gregorian?year=5786&month=1&day=15")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["gregorian"].startswith("2026")


# ── Next Occurrence ───────────────────────────────────────────────────────────

async def test_next_occurrence(client):
    print("\n📅 מתי יחול יום הכיפורים הבא (י' תשרי)")
    r = await client.get("/api/v1/synagogue/calendar/next-occurrence?month=7&day=10")
    assert r.status_code == 200
    data = r.json()["data"]
    assert "next_gregorian" in data
    assert len(data["next_gregorian"]) == 10  # YYYY-MM-DD


async def test_next_occurrence_with_from_date(client):
    print("\n📅 מתי יחול ראש השנה הבא החל מ-01/01/2025 – מצפה ל-23/09/2025")
    r = await client.get("/api/v1/synagogue/calendar/next-occurrence?month=7&day=1&from_date=2025-01-01")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["next_gregorian"] == "2025-09-23"


# ── Months List ───────────────────────────────────────────────────────────────

async def test_list_hebrew_months(client):
    print("\n📅 רשימת חודשי השנה העברית – לפחות 12 חודשים")
    r = await client.get("/api/v1/synagogue/calendar/months")
    assert r.status_code == 200
    months = r.json()["data"]["months"]
    assert len(months) >= 12


# ── Month View ────────────────────────────────────────────────────────────────

async def test_calendar_month_view(client):
    print("\n📅 תצוגת חודש תשרי תשפ\"ו – 30 ימים, כל יום כולל אזכרות ושמחות")
    r = await client.get("/api/v1/synagogue/calendar/month-view?year=5786&month=7")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["year"] == 5786
    assert data["month"] == 7
    assert len(data["days"]) == 30
    assert "azkarot" in data["days"][0]
    assert "smachot" in data["days"][0]
