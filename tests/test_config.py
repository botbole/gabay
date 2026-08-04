"""
Tests for TenantConfig infrastructure – Milestone 1.5.

Covers:
- GET  /api/v1/config   – default values, module manifest
- PATCH /api/v1/config  – update name, colours, enabled_modules
- Module Registry       – 8 modules registered on startup
- Event Bus (hooks)     – aliya donation → auto-payment (via hooks)
"""

import pytest

pytestmark = pytest.mark.usefixtures("authenticated_client")


# ── GET /config ────────────────────────────────────────────────────────────────

async def test_get_config_returns_defaults(client):
    """Fresh DB should return default TenantConfig values."""
    r = await client.get("/api/v1/config")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["synagogue_name"] == "בית הכנסת"
    assert data["color_primary"]   == "#2E3A59"
    assert data["color_secondary"] == "#C5A059"
    assert data["color_bg"]        == "#F8FAFC"


async def test_get_config_includes_enabled_modules_list(client):
    """enabled_modules_list should be a non-empty list of module IDs."""
    r = await client.get("/api/v1/config")
    data = r.json()["data"]
    modules = data["enabled_modules_list"]
    assert isinstance(modules, list)
    assert len(modules) > 0
    assert "congregants" in modules
    assert "llm" in modules


async def test_get_config_includes_modules_manifest(client):
    """modules_manifest should contain display metadata for each enabled module."""
    r = await client.get("/api/v1/config")
    data = r.json()["data"]
    manifest = data["modules_manifest"]
    assert isinstance(manifest, list)
    assert len(manifest) > 0

    ids = [m["module_id"] for m in manifest]
    assert "congregants" in ids

    first = manifest[0]
    assert "module_id"    in first
    assert "display_name" in first
    assert "icon"         in first
    assert "nav_path"     in first


# ── PATCH /config ──────────────────────────────────────────────────────────────

async def test_update_config_synagogue_name(client):
    """PATCH should update the synagogue name and persist it."""
    r = await client.patch("/api/v1/config", json={"synagogue_name": "בית כנסת הגדול"})
    assert r.status_code == 200
    assert r.json()["data"]["synagogue_name"] == "בית כנסת הגדול"

    # Confirm the change persists on next GET
    r2 = await client.get("/api/v1/config")
    assert r2.json()["data"]["synagogue_name"] == "בית כנסת הגדול"


async def test_update_config_colors(client):
    """PATCH should update colour variables."""
    r = await client.patch("/api/v1/config", json={
        "color_primary":   "#1A2B3C",
        "color_secondary": "#D4AF37",
    })
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["color_primary"]   == "#1A2B3C"
    assert data["color_secondary"] == "#D4AF37"


async def test_update_enabled_modules(client):
    """PATCH enabled_modules should update both the stored string and the list."""
    r = await client.patch("/api/v1/config", json={
        "enabled_modules": ["congregants", "payments", "calendar"],
    })
    assert r.status_code == 200
    data = r.json()["data"]
    assert set(data["enabled_modules_list"]) == {"congregants", "payments", "calendar"}


async def test_config_manifest_reflects_enabled_modules(client):
    """modules_manifest should only contain entries for enabled modules."""
    await client.patch("/api/v1/config", json={
        "enabled_modules": ["congregants", "payments"],
    })
    r = await client.get("/api/v1/config")
    data = r.json()["data"]
    manifest_ids = {m["module_id"] for m in data["modules_manifest"]}
    # Only the two enabled modules should appear in the manifest
    assert manifest_ids == {"congregants", "payments"}


async def test_patch_is_partial_other_fields_unchanged(client):
    """A PATCH that sets only one field must not reset the others."""
    # Set a known name first
    await client.patch("/api/v1/config", json={"synagogue_name": "כנסת אלפא"})
    # Now change only the color
    await client.patch("/api/v1/config", json={"color_primary": "#000000"})
    r = await client.get("/api/v1/config")
    data = r.json()["data"]
    # Name should be unchanged
    assert data["synagogue_name"] == "כנסת אלפא"
    # Color should be updated
    assert data["color_primary"] == "#000000"


# ── Module Registry ────────────────────────────────────────────────────────────

async def test_all_modules_registered(client):
    """
    The registry must contain all core modules after app startup.
    """
    r = await client.get("/api/v1/config")
    manifest = r.json()["data"]["modules_manifest"]
    module_ids = {m["module_id"] for m in manifest}
    expected = {"congregants", "payments", "aliyot", "seating",
                "azkarot", "smachot", "calendar", "llm", "prayer_schedule",
                "auth"}
    assert expected == module_ids


# ── Event Bus (hooks) ──────────────────────────────────────────────────────────

async def test_hooks_aliya_donation_creates_payment(client, congregant):
    """
    When an aliya is recorded with donation_amount > 0, the hooks event bus
    must trigger the payments module to auto-create a payment record.
    """
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/aliyot", json={
        "congregant_id": cid,
        "parasha": "שמות",
        "aliya_type": "Kohen",
        "donation_amount": 200.0,
    })

    r = await client.get(f"/api/v1/synagogue/payments/{cid}/history")
    data = r.json()["data"]
    assert data["total_paid"] == 200.0
    payments = data["payments"]
    assert len(payments) == 1
    assert payments[0]["purpose"] == "aliya"
    assert payments[0]["amount"] == 200.0


async def test_hooks_no_donation_no_auto_payment(client, congregant):
    """When donation_amount is 0 no payment should be created via hooks."""
    cid = congregant["id"]
    await client.post("/api/v1/synagogue/aliyot", json={
        "congregant_id": cid,
        "parasha": "ויקרא",
        "aliya_type": "Levi",
        "donation_amount": 0,
    })

    r = await client.get(f"/api/v1/synagogue/payments/{cid}/history")
    assert r.json()["data"]["total_paid"] == 0.0
    assert r.json()["data"]["payments"] == []
