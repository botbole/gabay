"""Least-privilege LLM tool selection and dispatch tests."""

import pytest

from app.core.authorization import AuthScope, AuthorizationError
from app.modules.auth.models import User, UserRole
from app.modules.congregants.service import congregant_service
from app.modules.llm.service import _dispatch_tool, tools_for_scope
from app.modules.payments.service import payment_service


def _tool_names(scope: AuthScope) -> set[str]:
    return {tool["function"]["name"] for tool in tools_for_scope(scope)}


def test_llm_tool_lists_are_selected_by_scope():
    admin_tools = _tool_names(
        AuthScope(actor_id="admin", role=UserRole.ADMIN)
    )
    gabai_tools = _tool_names(
        AuthScope(actor_id="gabai", role=UserRole.GABAI)
    )
    congregant_tools = _tool_names(
        AuthScope.for_congregant("congregant-1")
    )

    assert "list_congregants" in admin_tools
    assert "list_congregants" in gabai_tools
    assert "list_congregants" not in congregant_tools
    assert "get_prayer_times" in admin_tools
    assert "get_prayer_times" in gabai_tools
    assert "get_prayer_times" not in congregant_tools
    assert "get_my_payments" in congregant_tools
    assert "record_payment" not in congregant_tools
    assert "convert_gregorian_to_hebrew" in congregant_tools


async def test_dispatch_rejects_tool_outside_scope():
    scope = AuthScope.for_congregant("congregant-1")

    with pytest.raises(AuthorizationError) as exc_info:
        await _dispatch_tool("list_congregants", {}, scope)

    assert exc_info.value.status_code == 403


async def test_my_tool_uses_authenticated_congregant_id_only():
    admin = User(
        username="llm-admin",
        password_hash="unused",
        role=UserRole.ADMIN,
    )
    own = await congregant_service.add_congregant("Own", "Member", actor=admin)
    other = await congregant_service.add_congregant("Other", "Member", actor=admin)
    await payment_service.record_payment(
        own["id"],
        75,
        "donation",
        actor=admin,
    )
    await payment_service.record_payment(
        other["id"],
        900,
        "donation",
        actor=admin,
    )

    result = await _dispatch_tool(
        "get_my_payments",
        {"congregant_id": other["id"], "name": "Other Member"},
        AuthScope.for_congregant(own["id"]),
    )

    assert result["total_paid"] == 75
    assert {item["congregant_id"] for item in result["payments"]} == {own["id"]}
