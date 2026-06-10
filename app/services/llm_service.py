"""
LLM service – full Function Calling (Tool Use) implementation.

Architecture
------------
Instead of a two-step "guess the intent → call a stub" approach, we use
OpenAI's native function-calling protocol:

  1. We define every synagogue operation as a JSON-Schema "tool".
  2. We send the user's message + the tool list to the LLM in one API call.
  3. The LLM decides WHICH tool to call AND extracts the parameters from
     the natural language (e.g. "תוסיף תרומה של 100 ש"ח למשה כהן" →
     tool=record_payment, congregant_name="משה כהן", amount=100).
  4. We resolve any congregant name → id lookup, then call the real service.
  5. We feed the tool result back to the LLM so it can compose a Hebrew reply.

This is the standard production pattern for LLM-powered agents.
"""

from __future__ import annotations

import json
from typing import Any

from openai.types.chat import ChatCompletionMessageParam

from app.core.config import settings
from app.core.llm import llm_client
from app.services.synagogue_service import synagogue_service


# ---------------------------------------------------------------------------
# Tool (function) definitions – the schema the LLM sees
# ---------------------------------------------------------------------------

TOOLS: list[dict] = [
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
                                     "description": "סוג חברות: regular=קבוע, guest=אורח, occasional=מזדמן"},
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
                    "name": {"type": "string", "description": "שם המתפלל (שם פרטי, משפחה, או שניהם)"},
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
                    "member_type": {"type": "string", "enum": ["regular", "guest", "occasional"],
                                   "description": "סינון לפי סוג חברות (אופציונלי)"},
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
                    "congregant_name": {"type": "string", "description": "שם המתפלל"},
                    "amount":          {"type": "number", "description": "סכום התשלום"},
                    "purpose":         {"type": "string",
                                        "enum": ["donation", "aliya", "kiddush", "annual_dues", "seat_fee", "other"],
                                        "description": "מטרת התשלום"},
                    "currency":        {"type": "string", "enum": ["ILS", "USD", "EUR"], "description": "מטבע, ברירת מחדל ILS"},
                    "notes":           {"type": "string", "description": "הערות"},
                    "payment_date":    {"type": "string", "description": "תאריך בפורמט YYYY-MM-DD (ברירת מחדל: היום)"},
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
                    "congregant_name": {"type": "string", "description": "שם המתפלל"},
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
                    "purpose": {"type": "string", "description": "סינון לפי מטרה (אופציונלי)"},
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
                    "congregant_name":  {"type": "string", "description": "שם המתפלל"},
                    "parasha":          {"type": "string", "description": "שם הפרשה"},
                    "aliya_type":       {"type": "string",
                                         "description": "סוג העלייה: כהן, לוי, שלישי, רביעי, חמישי, שישי, שביעי, מפטיר"},
                    "date_str":         {"type": "string", "description": "תאריך בפורמט YYYY-MM-DD"},
                    "donation_amount":  {"type": "number", "description": "סכום נדבה (0 אם אין)"},
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
                    "parasha": {"type": "string", "description": "שם הפרשה"},
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
    # ── Azkarot (Yahrzeits) ───────────────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "add_azkara",
            "description": "הוספת אזכרה (יארצייט) של נפטר עבור מתפלל.",
            "parameters": {
                "type": "object",
                "properties": {
                    "congregant_name":       {"type": "string", "description": "שם המתפלל"},
                    "deceased_name":         {"type": "string", "description": "שם הנפטר/ת"},
                    "deceased_hebrew_name":  {"type": "string", "description": "שם הנפטר בעברית"},
                    "relation":              {"type": "string", "description": "קשר: אב, אם, בן/בת זוג, אח/אחות, בן/בת, אחר"},
                    "gregorian_date":        {"type": "string", "description": "תאריך פטירה גרגוריאני YYYY-MM-DD"},
                    "hebrew_day":            {"type": "integer", "description": "יום בחודש עברי (אם לא ידוע תאריך גרגוריאני)"},
                    "hebrew_month":          {"type": "integer", "description": "חודש עברי במספר"},
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
                    "days_ahead": {"type": "integer", "description": "מספר ימים קדימה (ברירת מחדל: 30)"},
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
                    "congregant_name":  {"type": "string", "description": "שם המתפלל"},
                    "occasion_type":    {"type": "string",
                                         "enum": ["birthday", "anniversary", "bar_mitzvah", "bat_mitzvah", "brit", "upsherin", "other"]},
                    "description":      {"type": "string", "description": "תיאור השמחה"},
                    "gregorian_date":   {"type": "string", "description": "תאריך גרגוריאני YYYY-MM-DD"},
                    "hebrew_day":       {"type": "integer"},
                    "hebrew_month":     {"type": "integer"},
                    "parasha":          {"type": "string", "description": "פרשה (לבר/בת מצווה)"},
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
                    "days_ahead":     {"type": "integer", "description": "מספר ימים קדימה (ברירת מחדל: 30)"},
                    "occasion_type":  {"type": "string", "description": "סינון לפי סוג שמחה (אופציונלי)"},
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
                    "section":   {"type": "string", "description": "אגף (ראשי, מזרח, עזרת נשים...)"},
                    "only_free": {"type": "boolean", "description": "הצג רק מושבים פנויים"},
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
                    "date": {"type": "string", "description": "תאריך גרגוריאני בפורמט YYYY-MM-DD"},
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
                    "year":  {"type": "integer", "description": "שנה עברית (למשל 5786)"},
                    "month": {"type": "integer", "description": "חודש עברי במספר (ניסן=1...אדר=12, אדר ב=13)"},
                    "day":   {"type": "integer", "description": "יום בחודש"},
                },
                "required": ["year", "month", "day"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Dispatcher – maps tool name → actual service call
# Handles the name→id resolution automatically
# ---------------------------------------------------------------------------

async def _resolve_congregant(name: str) -> dict | None:
    """Find a congregant by name and return their full record, or None."""
    return await synagogue_service.find_congregant_by_name(name)


async def _dispatch_tool(tool_name: str, args: dict) -> Any:
    """Execute the requested tool and return the service result."""

    # ── Congregants ──────────────────────────────────────────────────────
    if tool_name == "add_congregant":
        return await synagogue_service.add_congregant(**args)

    if tool_name == "get_congregant":
        c = await _resolve_congregant(args["name"])
        if not c:
            return {"error": f"לא נמצא מתפלל בשם '{args['name']}'."}
        return c

    if tool_name == "update_congregant":
        c = await _resolve_congregant(args.pop("name"))
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.update_congregant(c["id"], args)

    if tool_name == "list_congregants":
        return await synagogue_service.list_congregants(member_type=args.get("member_type"))

    # ── Payments ─────────────────────────────────────────────────────────
    if tool_name == "record_payment":
        c = await _resolve_congregant(args.pop("congregant_name"))
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.record_payment(
            congregant_id=c["id"],
            amount=args["amount"],
            purpose=args["purpose"],
            currency=args.get("currency", "ILS"),
            notes=args.get("notes", ""),
            payment_date=args.get("payment_date", ""),
        )

    if tool_name == "get_payment_history":
        c = await _resolve_congregant(args["congregant_name"])
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.get_payment_history(c["id"])

    if tool_name == "get_pending_payments":
        return await synagogue_service.get_pending_payments()

    if tool_name == "get_all_payments":
        return await synagogue_service.get_all_payments(purpose=args.get("purpose"))

    # ── Aliyot ───────────────────────────────────────────────────────────
    if tool_name == "assign_aliya":
        c = await _resolve_congregant(args.pop("congregant_name"))
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.assign_aliya(
            congregant_id=c["id"],
            parasha=args["parasha"],
            aliya_type=args["aliya_type"],
            date_str=args.get("date_str", ""),
            donation_amount=args.get("donation_amount", 0.0),
            notes=args.get("notes", ""),
        )

    if tool_name == "get_aliyot_for_parasha":
        return await synagogue_service.get_aliyot_for_parasha(args["parasha"])

    if tool_name == "get_aliya_history":
        c = await _resolve_congregant(args["congregant_name"])
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.get_aliya_history(c["id"])

    # ── Azkarot ───────────────────────────────────────────────────────────
    if tool_name == "add_azkara":
        c = await _resolve_congregant(args.pop("congregant_name"))
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.add_azkara(
            congregant_id=c["id"],
            deceased_name=args["deceased_name"],
            deceased_hebrew_name=args.get("deceased_hebrew_name", ""),
            relation=args.get("relation", ""),
            gregorian_date=args.get("gregorian_date", ""),
            hebrew_day=args.get("hebrew_day", 0),
            hebrew_month=args.get("hebrew_month", 0),
            notes=args.get("notes", ""),
        )

    if tool_name == "get_upcoming_azkarot":
        return await synagogue_service.get_upcoming_azkarot(days_ahead=args.get("days_ahead", 30))

    # ── Smachot ───────────────────────────────────────────────────────────
    if tool_name == "add_simcha":
        c = await _resolve_congregant(args.pop("congregant_name"))
        if not c:
            return {"error": "לא נמצא המתפלל."}
        return await synagogue_service.add_simcha(
            congregant_id=c["id"],
            occasion_type=args["occasion_type"],
            description=args.get("description", ""),
            gregorian_date=args.get("gregorian_date", ""),
            hebrew_day=args.get("hebrew_day", 0),
            hebrew_month=args.get("hebrew_month", 0),
            parasha=args.get("parasha", ""),
            notes=args.get("notes", ""),
        )

    if tool_name == "get_upcoming_smachot":
        return await synagogue_service.get_upcoming_smachot(
            days_ahead=args.get("days_ahead", 30),
            occasion_type=args.get("occasion_type"),
        )

    # ── Seating ───────────────────────────────────────────────────────────
    if tool_name == "list_places":
        return await synagogue_service.list_places(
            section=args.get("section"),
            only_free=args.get("only_free", False),
        )

    if tool_name == "get_congregant_place":
        c = await _resolve_congregant(args["congregant_name"])
        if not c:
            return {"error": "לא נמצא המתפלל."}
        place = await synagogue_service.get_congregant_place(c["id"])
        if not place:
            return {"info": f"למתפלל {args['congregant_name']} אין מקום מושב מוקצה."}
        return place

    # ── Hebrew Calendar ───────────────────────────────────────────────────
    if tool_name == "convert_gregorian_to_hebrew":
        return await synagogue_service.convert_gregorian_to_hebrew(args["date"])

    if tool_name == "convert_hebrew_to_gregorian":
        return await synagogue_service.convert_hebrew_to_gregorian(
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
    ) -> dict:
        """
        Send a message to the LLM.

        The LLM may:
          a) Reply with plain text (for questions / explanations).
          b) Call one or more tools, get the results, then compose a final reply.

        Returns:
          {
            "reply":   str,           # the assistant's final Hebrew text
            "actions": list[dict],    # tools that were called (may be empty)
          }
        """
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": settings.LLM_SYSTEM_PROMPT},
        ]
        for turn in (history or []):
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_message})

        actions_performed: list[dict] = []

        # Agentic loop – the LLM may call multiple tools in sequence
        for _ in range(10):  # safety cap: max 10 tool-call rounds
            response = await llm_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                tools=TOOLS,  # type: ignore[arg-type]
                tool_choice="auto",
                max_tokens=settings.LLM_MAX_TOKENS,
                temperature=settings.LLM_TEMPERATURE,
            )

            msg = response.choices[0].message

            # No tool call → LLM produced a plain text reply → done
            if not msg.tool_calls:
                return {
                    "reply": msg.content or "",
                    "actions": actions_performed,
                }

            # Append the assistant message (with tool_calls) to conversation
            messages.append(msg)  # type: ignore[arg-type]

            # Execute every tool call the LLM requested
            for tc in msg.tool_calls:
                tool_name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    args = {}

                result = await _dispatch_tool(tool_name, args)
                actions_performed.append({"tool": tool_name, "args": args, "result": result})

                # Feed the result back into the conversation
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False, default=str),
                })

        # Fallback – should never reach here in practice
        return {"reply": "מצטער, לא הצלחתי לסיים את הפעולה.", "actions": actions_performed}


llm_service = LLMService()
