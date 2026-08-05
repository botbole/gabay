"""
LLM service – Function Calling (Tool Use) implementation.

Delegates tool execution to individual module services instead of
the monolithic synagogue_service.
"""

from __future__ import annotations

import json
from typing import Any

from openai.types.chat import ChatCompletionMessageParam

from app.core.authorization import (
    Actor,
    AuthScope,
    AuthorizationError,
    get_auth_scope,
)
from app.core.config import settings
from app.core.llm import llm_client
from app.modules.auth.models import UserRole


# ---------------------------------------------------------------------------
# Tool (function) definitions – the schema the LLM sees
# ---------------------------------------------------------------------------

OPERATIONAL_TOOLS: list[dict] = [
    # ── Congregants ──────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "add_congregant",
            "description": "רישום מתפלל חדש בבית הכנסת.",
            "parameters": {
                "type": "object",
                "properties": {
                    "first_name":   {"type": "string", "description": "שם פרטי"},
                    "last_name":    {"type": "string", "description": "שם משפחה"},
                    "hebrew_name":  {"type": "string", "description": "שם בעברית (כולל בן/בת)"},
                    "father_name":  {"type": "string", "description": "שם האב"},
                    "phone":        {"type": "string", "description": "מספר טלפון"},
                    "email":        {"type": "string", "description": "כתובת אימייל"},
                    "address":      {"type": "string", "description": "כתובת מגורים"},
                    "is_kohen":     {"type": "boolean", "description": "האם כהן"},
                    "is_levi":      {"type": "boolean", "description": "האם לוי"},
                    "member_type":  {"type": "string", "enum": ["regular", "guest", "occasional"],
                                     "description": "סוג חברות"},
                    "notes":        {"type": "string", "description": "הערות נוספות"},
                },
                "required": ["first_name", "last_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_congregant",
            "description": "שליפת פרטי מתפלל לפי שם (חלקי או מלא).",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "שם המתפלל"},
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_congregant",
            "description": "עדכון פרטי מתפלל קיים.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name":         {"type": "string", "description": "שם המתפלל לאיתור"},
                    "first_name":   {"type": "string"},
                    "last_name":    {"type": "string"},
                    "hebrew_name":  {"type": "string"},
                    "father_name":  {"type": "string"},
                    "phone":        {"type": "string"},
                    "email":        {"type": "string"},
                    "address":      {"type": "string"},
                    "is_kohen":     {"type": "boolean"},
                    "is_levi":      {"type": "boolean"},
                    "member_type":  {"type": "string", "enum": ["regular", "guest", "occasional"]},
                    "notes":        {"type": "string"},
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_congregants",
            "description": "הצגת רשימת כל המתפללים, עם אפשרות סינון לפי סוג חברות.",
            "parameters": {
                "type": "object",
                "properties": {
                    "member_type": {"type": "string", "enum": ["regular", "guest", "occasional"]},
                },
            },
        },
    },
    # ── Payments ─────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "record_payment",
            "description": "רישום תשלום או תרומה של מתפלל.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name": {"type": "string"},
                    "amount":          {"type": "number"},
                    "purpose":         {"type": "string",
                                        "enum": ["donation", "aliya", "kiddush", "annual_dues", "seat_fee", "other"]},
                    "currency":        {"type": "string", "enum": ["ILS", "USD", "EUR"]},
                    "notes":           {"type": "string"},
                    "payment_date":    {"type": "string"},
                },
                "required": ["congregant_name", "amount", "purpose"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_payment_history",
            "description": "הצגת היסטוריית תשלומים של מתפלל.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name": {"type": "string"},
                },
                "required": ["congregant_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_pending_payments",
            "description": "הצגת רשימת מתפללים שטרם שילמו.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_payments",
            "description": "הצגת כל התשלומים, עם אפשרות סינון לפי מטרה.",
            "parameters": {
                "type": "object",
                "properties": {
                    "purpose": {"type": "string"},
                },
            },
        },
    },
    # ── Aliyot ───────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "assign_aliya",
            "description": "שיוך עלייה לתורה למתפלל עבור פרשה מסוימת.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name":  {"type": "string"},
                    "parasha":          {"type": "string"},
                    "aliya_type":       {"type": "string"},
                    "date_str":         {"type": "string"},
                    "donation_amount":  {"type": "number"},
                    "notes":            {"type": "string"},
                },
                "required": ["congregant_name", "parasha", "aliya_type"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_aliyot_for_parasha",
            "description": "הצגת רשימת העולים לתורה עבור פרשה מסוימת.",
            "parameters": {
                "type": "object",
                "properties": {
                    "parasha": {"type": "string"},
                },
                "required": ["parasha"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_aliya_history",
            "description": "הצגת היסטוריית עליות לתורה של מתפלל.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name": {"type": "string"},
                },
                "required": ["congregant_name"],
            },
        },
    },
    # ── Azkarot ───────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "add_azkara",
            "description": "הוספת אזכרה (יארצייט) של נפטר עבור מתפלל.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name":       {"type": "string"},
                    "deceased_name":         {"type": "string"},
                    "deceased_hebrew_name":  {"type": "string"},
                    "relation":              {"type": "string"},
                    "gregorian_date":        {"type": "string"},
                    "hebrew_day":            {"type": "integer"},
                    "hebrew_month":          {"type": "integer"},
                    "notes":                 {"type": "string"},
                },
                "required": ["congregant_name", "deceased_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_azkarot",
            "description": "הצגת אזכרות קרובות בטווח הימים הבא.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_ahead": {"type": "integer"},
                },
            },
        },
    },
    # ── Smachot ───────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "add_simcha",
            "description": "הוספת שמחה (יום הולדת, יום נישואין, בר/בת מצווה, ברית, אופשרין).",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name":  {"type": "string"},
                    "occasion_type":    {"type": "string",
                                         "enum": ["birthday", "anniversary", "bar_mitzvah",
                                                  "bat_mitzvah", "brit", "upsherin", "other"]},
                    "description":      {"type": "string"},
                    "gregorian_date":   {"type": "string"},
                    "hebrew_day":       {"type": "integer"},
                    "hebrew_month":     {"type": "integer"},
                    "parasha":          {"type": "string"},
                    "notes":            {"type": "string"},
                },
                "required": ["congregant_name", "occasion_type"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_smachot",
            "description": "הצגת שמחות קרובות בטווח הימים הבא.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_ahead":     {"type": "integer"},
                    "occasion_type":  {"type": "string"},
                },
            },
        },
    },
    # ── Seating ───────────────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "list_places",
            "description": "הצגת מפת המושבים, עם אפשרות סינון לפי אגף או פנויים בלבד.",
            "parameters": {
                "type": "object",
                "properties": {
                    "section":   {"type": "string"},
                    "only_free": {"type": "boolean"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_congregant_place",
            "description": "הצגת מקום המושב של מתפלל.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name": {"type": "string"},
                },
                "required": ["congregant_name"],
            },
        },
    },
    # ── Hebrew Calendar ───────────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "convert_gregorian_to_hebrew",
            "description": "המרת תאריך גרגוריאני לתאריך עברי.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                },
                "required": ["date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "convert_hebrew_to_gregorian",
            "description": "המרת תאריך עברי לתאריך גרגוריאני.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year":  {"type": "integer"},
                    "month": {"type": "integer"},
                    "day":   {"type": "integer"},
                },
                "required": ["year", "month", "day"],
            },
        },
    },
]

CONGREGANT_MY_TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_my_profile",
            "description": "הצגת הפרטים האישיים שלי.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_payments",
            "description": "הצגת היסטוריית התשלומים שלי.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_aliyot",
            "description": "הצגת היסטוריית העליות לתורה שלי.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_azkarot",
            "description": "הצגת האזכרות המשויכות אליי.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_smachot",
            "description": "הצגת השמחות המשויכות אליי.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_seat",
            "description": "הצגת מקום הישיבה שלי.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]

PUBLIC_TOOL_NAMES = {
    "convert_gregorian_to_hebrew",
    "convert_hebrew_to_gregorian",
}
PUBLIC_TOOLS = [
    tool
    for tool in OPERATIONAL_TOOLS
    if tool["function"]["name"] in PUBLIC_TOOL_NAMES
]
ADMIN_TOOLS: list[dict] = []


def tools_for_scope(scope: AuthScope) -> list[dict]:
    if scope.role == UserRole.ADMIN:
        return [*OPERATIONAL_TOOLS, *ADMIN_TOOLS]
    if scope.role == UserRole.GABAI:
        return list(OPERATIONAL_TOOLS)
    if scope.role == UserRole.CONGREGANT:
        return [*PUBLIC_TOOLS, *CONGREGANT_MY_TOOLS]
    raise AuthorizationError("Insufficient permissions", 403)


def _tool_names_for_scope(scope: AuthScope) -> set[str]:
    return {tool["function"]["name"] for tool in tools_for_scope(scope)}


# ---------------------------------------------------------------------------
# Dispatcher – maps tool name → module service calls
# ---------------------------------------------------------------------------

async def _resolve_congregant(name: str, *, actor: Actor) -> dict | None:
    from app.modules.congregants.service import congregant_service
    return await congregant_service.find_congregant_by_name(name, actor=actor)


async def _dispatch_tool(
    tool_name: str,
    args: dict,
    actor: Actor,
) -> Any:  # noqa: PLR0911, PLR0912
    scope = get_auth_scope(actor)
    if tool_name not in _tool_names_for_scope(scope):
        raise AuthorizationError("Tool is not allowed for this scope", 403)

    from app.modules.congregants.service import congregant_service
    from app.modules.payments.service import payment_service
    from app.modules.aliyot.service import aliyot_service
    from app.modules.azkarot.service import azkara_service
    from app.modules.smachot.service import simcha_service
    from app.modules.seating.service import seating_service
    from app.modules.calendar.service import calendar_service

    if tool_name == "get_my_profile":
        return await congregant_service.get_congregant(
            scope.congregant_id or "",
            actor=scope,
        )

    if tool_name == "get_my_payments":
        return await payment_service.get_payment_history(
            scope.congregant_id or "",
            actor=scope,
        )

    if tool_name == "get_my_aliyot":
        return await aliyot_service.get_aliya_history(
            scope.congregant_id or "",
            actor=scope,
        )

    if tool_name == "get_my_azkarot":
        return await azkara_service.list_azkarot(actor=scope)

    if tool_name == "get_my_smachot":
        return await simcha_service.list_smachot(actor=scope)

    if tool_name == "get_my_seat":
        return await seating_service.get_congregant_place(
            scope.congregant_id or "",
            actor=scope,
        )

    # ── Congregants ──────────────────────────────────────────────────────
    if tool_name == "add_congregant":
        return await congregant_service.add_congregant(**args, actor=scope)

    if tool_name == "get_congregant":
        c = await _resolve_congregant(args["name"], actor=scope)
        return c if c else {"error": f"לא נמצא מתפלל בשם '{args['name']}'."}

    if tool_name == "update_congregant":
        c = await _resolve_congregant(args.pop("name"), actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await congregant_service.update_congregant(c["id"], args, actor=scope)

    if tool_name == "list_congregants":
        return await congregant_service.list_congregants(
            member_type=args.get("member_type"),
            actor=scope,
        )

    # ── Payments ─────────────────────────────────────────────────────────
    if tool_name == "record_payment":
        c = await _resolve_congregant(args.pop("congregant_name"), actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await payment_service.record_payment(
            congregant_id=c["id"],
            amount=args["amount"],
            purpose=args["purpose"],
            currency=args.get("currency", "ILS"),
            notes=args.get("notes", ""),
            payment_date=args.get("payment_date", ""),
            actor=scope,
        )

    if tool_name == "get_payment_history":
        c = await _resolve_congregant(args["congregant_name"], actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await payment_service.get_payment_history(c["id"], actor=scope)

    if tool_name == "get_pending_payments":
        return await payment_service.get_pending_payments(actor=scope)

    if tool_name == "get_all_payments":
        return await payment_service.get_all_payments(
            purpose=args.get("purpose"),
            actor=scope,
        )

    # ── Aliyot ───────────────────────────────────────────────────────────
    if tool_name == "assign_aliya":
        c = await _resolve_congregant(args.pop("congregant_name"), actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await aliyot_service.assign_aliya(
            congregant_id=c["id"],
            parasha=args["parasha"],
            aliya_type=args["aliya_type"],
            date_str=args.get("date_str", ""),
            donation_amount=args.get("donation_amount", 0.0),
            notes=args.get("notes", ""),
            actor=scope,
        )

    if tool_name == "get_aliyot_for_parasha":
        return await aliyot_service.get_aliyot_for_parasha(
            args["parasha"],
            actor=scope,
        )

    if tool_name == "get_aliya_history":
        c = await _resolve_congregant(args["congregant_name"], actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await aliyot_service.get_aliya_history(c["id"], actor=scope)

    # ── Azkarot ───────────────────────────────────────────────────────────
    if tool_name == "add_azkara":
        c = await _resolve_congregant(args.pop("congregant_name"), actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await azkara_service.add_azkara(
            congregant_id=c["id"],
            deceased_name=args["deceased_name"],
            deceased_hebrew_name=args.get("deceased_hebrew_name", ""),
            relation=args.get("relation", ""),
            gregorian_date=args.get("gregorian_date", ""),
            hebrew_day=args.get("hebrew_day", 0),
            hebrew_month=args.get("hebrew_month", 0),
            notes=args.get("notes", ""),
            actor=scope,
        )

    if tool_name == "get_upcoming_azkarot":
        return await azkara_service.get_upcoming_azkarot(
            days_ahead=args.get("days_ahead", 30),
            actor=scope,
        )

    # ── Smachot ───────────────────────────────────────────────────────────
    if tool_name == "add_simcha":
        c = await _resolve_congregant(args.pop("congregant_name"), actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await simcha_service.add_simcha(
            congregant_id=c["id"],
            occasion_type=args["occasion_type"],
            description=args.get("description", ""),
            gregorian_date=args.get("gregorian_date", ""),
            hebrew_day=args.get("hebrew_day", 0),
            hebrew_month=args.get("hebrew_month", 0),
            parasha=args.get("parasha", ""),
            notes=args.get("notes", ""),
            actor=scope,
        )

    if tool_name == "get_upcoming_smachot":
        return await simcha_service.get_upcoming_smachot(
            days_ahead=args.get("days_ahead", 30),
            occasion_type=args.get("occasion_type"),
            actor=scope,
        )

    # ── Seating ───────────────────────────────────────────────────────────
    if tool_name == "list_places":
        return await seating_service.list_places(
            section=args.get("section"),
            only_free=args.get("only_free", False),
            actor=scope,
        )

    if tool_name == "get_congregant_place":
        c = await _resolve_congregant(args["congregant_name"], actor=scope)
        if not c:
            return {"error": "לא נמצא המתפלל."}
        place = await seating_service.get_congregant_place(c["id"], actor=scope)
        if not place:
            return {"info": f"למתפלל {args['congregant_name']} אין מקום מושב מוקצה."}
        return place

    # ── Hebrew Calendar ───────────────────────────────────────────────────
    if tool_name == "convert_gregorian_to_hebrew":
        return await calendar_service.convert_gregorian_to_hebrew(args["date"])

    if tool_name == "convert_hebrew_to_gregorian":
        return await calendar_service.convert_hebrew_to_gregorian(
            year=args["year"], month=args["month"], day=args["day"]
        )

    return {"error": f"כלי לא מוכר: {tool_name}"}


# ---------------------------------------------------------------------------
# LLM Service
# ---------------------------------------------------------------------------

class LLMService:

    async def chat(
        self,
        user_message: str,
        history: list[dict] | None = None,
        *,
        actor: Actor,
    ) -> dict:
        scope = get_auth_scope(actor)
        scoped_tools = tools_for_scope(scope)
        scope_prompt = (
            "\n\nכללי הרשאה: השתמש רק בכלים שסופקו. "
            "בגישה אישית מותר להציג רק את נתוני המשתמש המאומת."
        )
        messages: list[ChatCompletionMessageParam] = [
            {
                "role": "system",
                "content": settings.LLM_SYSTEM_PROMPT + scope_prompt,
            },
        ]
        for turn in (history or []):
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})

        actions_performed: list[dict] = []

        for _ in range(10):
            response = await llm_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                tools=scoped_tools,  # type: ignore[arg-type]
                tool_choice="auto",
                max_tokens=settings.LLM_MAX_TOKENS,
                temperature=settings.LLM_TEMPERATURE,
            )

            msg = response.choices[0].message

            if not msg.tool_calls:
                return {
                    "reply": msg.content or "",
                    "actions": actions_performed,
                }

            messages.append(msg)  # type: ignore[arg-type]

            for tc in msg.tool_calls:
                tool_name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                result = await _dispatch_tool(tool_name, args, scope)
                actions_performed.append({"tool": tool_name, "args": args, "result": result})

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False, default=str),
                })

        return {"reply": "מצטער, לא הצלחתי לסיים את הפעולה.", "actions": actions_performed}


llm_service = LLMService()
