"""Server-side authorization scope and row-isolation tests."""

import pytest

from app.core.authorization import (
    AuthScope,
    AuthorizationError,
    get_auth_scope,
)
from app.modules.auth.models import User, UserRole
from app.modules.congregants.service import congregant_service
from app.modules.payments.service import payment_service


def _admin() -> User:
    return User(
        username="scope-admin",
        password_hash="unused",
        role=UserRole.ADMIN,
    )


def test_congregant_scope_requires_congregant_id():
    user = User(
        username="unlinked",
        password_hash="unused",
        role=UserRole.CONGREGANT,
    )

    with pytest.raises(AuthorizationError) as exc_info:
        get_auth_scope(user)

    assert exc_info.value.status_code == 403


def test_scope_can_represent_future_whatsapp_identity():
    scope = AuthScope.for_congregant(
        "congregant-1",
        actor_id="phone:+972500000000",
    )

    assert scope.role == UserRole.CONGREGANT
    assert scope.congregant_id == "congregant-1"
    assert scope.channel == "whatsapp"


async def test_congregant_reads_are_filtered_and_cross_owner_reads_are_denied():
    admin = _admin()
    own = await congregant_service.add_congregant(
        "Own",
        "Member",
        actor=admin,
    )
    other = await congregant_service.add_congregant(
        "Other",
        "Member",
        actor=admin,
    )
    await payment_service.record_payment(
        own["id"],
        100,
        "donation",
        actor=admin,
    )
    await payment_service.record_payment(
        other["id"],
        250,
        "donation",
        actor=admin,
    )
    scope = AuthScope.for_congregant(own["id"])

    own_history = await payment_service.get_payment_history(
        own["id"],
        actor=scope,
    )
    assert own_history["total_paid"] == 100
    assert {item["congregant_id"] for item in own_history["payments"]} == {own["id"]}

    listed = await congregant_service.list_congregants(actor=scope)
    assert [item["id"] for item in listed["congregants"]] == [own["id"]]

    with pytest.raises(AuthorizationError):
        await payment_service.get_payment_history(other["id"], actor=scope)
    with pytest.raises(AuthorizationError):
        await congregant_service.get_congregant(other["id"], actor=scope)


async def test_congregant_scope_cannot_perform_operational_mutations():
    scope = AuthScope.for_congregant("congregant-1")

    with pytest.raises(AuthorizationError) as exc_info:
        await payment_service.record_payment(
            "congregant-2",
            50,
            "donation",
            actor=scope,
        )

    assert exc_info.value.status_code == 403
