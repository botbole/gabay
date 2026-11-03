# Hebrew LLM assistant (the digital gabai)

Status: done
Roadmap item: v2 (prayer times tool in v2.1, role scope in v3.0)
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 2, v2.1, v3.0 step 3), `docs/PRD_Gabay.md` section 4.8.

## Problem
Finding a record or making a change means knowing which page and which form to use. During prayers or on the phone, the gabai wants to just ask.

## User story
As a gabai, I want to ask questions and make changes in Hebrew in a chat, so that I can work without navigating menus.

## Acceptance criteria
- [x] Hebrew RTL chat with message bubbles, avatar and typing indicator, calling `/api/v1/llm/chat`.
- [x] Multi-turn conversation history.
- [x] Tool-calling loop of up to 10 rounds; the UI shows which tools ran.
- [x] Tools for congregants (add, get, update, list), payments (record, history, pending, all), aliyot (assign, by parasha, history), yahrzeits (add, upcoming), simchot (add, upcoming), seating (list, congregant's seat), calendar (convert both ways).
- [x] When no tool fits, the answer is a Hebrew explanation asking for more detail.
- [x] `get_prayer_times(date)` returns the calculated schedule.
- [x] The tool list depends on the server-side role and scope: admin gets administrative and operational tools, gabai gets operational tools, congregant gets public and `my_*` tools only.
- [x] Every tool call is re-authorized at dispatch; congregant scope is filtered by `congregant_id` in the database query, so a prompt cannot reach another congregant's data.
- [x] `/llm/chat` is rate limited.

## Out of scope
- Assistant as a side panel on every screen (v2.2.5 F4b).
- Saved conversations with list, rename and delete (v2.2.6, `specs/assistant-chat-history.md`). Today history lives in the page and is lost on reload.
- RAG over PDFs, complex queries and halachic times in answers (v2.4).
- Provider, model and API key in `TenantConfig` (v2.5).
- WhatsApp channel (v3.5).

## Risks and open questions
- Payment tools report every payment as money received until the pledge spec ships.

## Slices
1. v2, shipped: chat UI, tool loop, tools for the v1 features and the calendar.
2. v2.1, shipped: `get_prayer_times`.
3. v3.0, shipped: tool list by role and scope, re-authorization at dispatch, rate limit.
