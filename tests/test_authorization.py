"""Backend authorization matrix for protected router groups."""

import pytest

from app.core.authorization import AuthorizationError
from app.core.tenant_service import update_tenant_config
from app.modules.auth.models import User, UserRole
from app.modules.llm.service import _dispatch_tool


PROTECTED_ROUTES = [
    ("GET", "/api/v1/synagogue/congregants", None),
    ("GET", "/api/v1/synagogue/payments", None),
    ("GET", "/api/v1/synagogue/aliyot", None),
    ("GET", "/api/v1/synagogue/places", None),
    ("GET", "/api/v1/synagogue/azkarot", None),
    ("GET", "/api/v1/synagogue/smachot", None),
    ("GET", "/api/v1/synagogue/calendar/months", None),
    ("GET", "/api/v1/synagogue/prayer-rules", None),
    ("GET", "/api/v1/synagogue/bulletin", None),
    ("POST", "/api/v1/llm/chat", {"message": "test"}),
]


@pytest.mark.parametrize("method,path,payload", PROTECTED_ROUTES)
async def test_anonymous_users_are_rejected_by_every_router(
    client,
    method,
    path,
    payload,
):
    response = await client.request(method, path, json=payload)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("method,path,payload", PROTECTED_ROUTES)
async def test_congregant_role_is_rejected_by_every_operational_router(
    client,
    congregant_session,
    method,
    path,
    payload,
):
    response = await client.request(
        method,
        path,
        json=payload,
        headers=congregant_session["headers"],
    )
    assert response.status_code == 403


async def test_gabai_can_use_operational_routes(client, gabai_session):
    response = await client.get(
        "/api/v1/synagogue/congregants",
        headers=gabai_session["headers"],
    )
    assert response.status_code == 200


async def test_config_patch_is_admin_only(client, admin_session, gabai_session):
    anonymous = await client.patch("/api/v1/config", json={"synagogue_name": "Blocked"})
    assert anonymous.status_code == 401

    forbidden = await client.patch(
        "/api/v1/config",
        json={"synagogue_name": "Blocked"},
        headers=gabai_session["headers"],
    )
    assert forbidden.status_code == 403

    allowed = await client.patch(
        "/api/v1/config",
        json={"synagogue_name": "Authorized"},
        headers=admin_session["headers"],
    )
    assert allowed.status_code == 200


async def test_registration_is_admin_only_after_bootstrap(
    client,
    admin_session,
    gabai_session,
    auth_password,
):
    payload = {"username": "new-user", "password": auth_password, "role": "gabai"}

    anonymous = await client.post("/api/v1/auth/register", json=payload)
    assert anonymous.status_code == 401

    forbidden = await client.post(
        "/api/v1/auth/register",
        json=payload,
        headers=gabai_session["headers"],
    )
    assert forbidden.status_code == 403


async def test_public_allowlist_remains_accessible(client, admin_session, auth_password):
    assert (await client.get("/health")).status_code == 200
    assert (await client.get("/api/v1/config")).status_code == 200

    login = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": auth_password},
    )
    assert login.status_code == 200
    assert (await client.post("/api/v1/auth/logout")).status_code == 200


def test_tenant_service_rechecks_admin_role():
    gabai = User(
        username="gabai",
        password_hash="unused",
        role=UserRole.GABAI,
    )
    with pytest.raises(AuthorizationError) as exc_info:
        update_tenant_config(gabai, {"synagogue_name": "Blocked"})
    assert exc_info.value.status_code == 403


async def test_llm_dispatch_rechecks_operational_role():
    congregant = User(
        username="congregant",
        password_hash="unused",
        role=UserRole.CONGREGANT,
    )
    with pytest.raises(AuthorizationError) as exc_info:
        await _dispatch_tool("list_congregants", {}, congregant)
    assert exc_info.value.status_code == 403
