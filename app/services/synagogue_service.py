"""
Synagogue business-logic layer.

Placeholder service – concrete operations (prayer times, seat assignments,
donations, events, member registry, etc.) will be implemented here.
"""


class SynagogueService:
    async def get_info(self) -> dict:
        """Return basic synagogue information (stub)."""
        return {
            "name": "Gabay Synagogue",
            "operations": [
                "prayer_times",
                "member_registry",
                "seat_management",
                "donations",
                "events",
            ],
            "note": "Operations will be defined and implemented in future iterations.",
        }


synagogue_service = SynagogueService()
