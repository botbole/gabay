# Assistant chat history (saved conversations)

Status: draft
Roadmap item: v2.2.6
Owner: eran

Sources: `ROADMAP.md` (v2.2.6), `docs/product/DECISIONS.md` (the three 2026-11-03 planned entries), `specs/llm-assistant.md`, the detailed plan `assistant_chat_history_8b2c9ccd.plan.md` (outside the repo). Depends on v2.2.5 F4b (assistant side panel on every screen), which is not part of this spec.

## Problem
The gabai and the admin use the Hebrew assistant during the day, often across several pages and devices. Today `POST /llm/chat` is stateless: the client sends `history`, nothing is stored, and the conversation is lost on reload, on logout and when moving to another computer. To continue a task ("the yahrzeit we added yesterday"), the user retypes the context. The client-sent history is also trusted as-is, so a client can inject fake assistant turns.

Without this feature the side panel (F4b) works, but every reload starts from zero and there is no way to find an earlier answer.

## User story
As a gabai or admin, I want my assistant conversations saved on the server, listed by date, searchable by title, and openable to continue, rename or delete, so that I can pick up earlier work on any device without retyping context.

## Acceptance criteria
Backend items map to cases in `tests/test_llm_conversations.py` (LLM client mocked). Frontend items are manual or Playwright checks.

Storage and chat
- [ ] `POST /llm/chat` without `conversation_id` creates a `Conversation` owned by the caller (`user_id == actor.actor_id`), stores the user message and the assistant reply (with `actions` as JSON), and returns `conversation_id` in `data` together with `reply` and `actions`.
- [ ] The new conversation's title is the first user message, whitespace-trimmed and cut to 60 characters. No extra LLM call is made (the mocked client is called only for the chat turn itself).
- [ ] `POST /llm/chat` with an existing `conversation_id` appends both turns to that conversation and updates its `updated_at`.
- [ ] With `conversation_id`, the messages sent to the LLM are the system prompt, the last N stored messages of that conversation in order, and the new user message. A `history` field in the same request is ignored (test: send a fake assistant turn in `history` and assert it does not reach the mocked client).
- [ ] With more than N stored messages, only the last N are sent to the LLM.
- [ ] `POST /llm/chat` with a `conversation_id` that does not exist or belongs to another user returns 404 and stores nothing.
- [ ] `POST /llm/action` behaves as before and does not create a conversation. (Open question below: whether plain `/llm/chat` without `conversation_id` should still create one.)
- [ ] The LLM rate limit still applies to `/llm/chat` with and without `conversation_id` (429 after `LLM_CHAT_RATE_LIMIT` hits).
- [ ] If the LLM call fails (502), the conversation has no orphan user message without a reply, or the behavior is documented in the test (see open question on partial turns).

Conversation routes (all return `{ success, message, data }`, same `require_operational_scope` as `/chat`)
- [ ] `GET /llm/conversations` returns only the caller's conversations, newest `updated_at` first, without messages, paginated (`limit`, `offset` or the project's existing pagination pattern), with the total count.
- [ ] `GET /llm/conversations?q=<text>` filters by case-insensitive title substring, Hebrew included.
- [ ] `GET /llm/conversations/{id}` returns the conversation with all messages in chronological order.
- [ ] `PATCH /llm/conversations/{id}` with `{ "title": ... }` renames it; empty or whitespace-only titles return 422; titles over 60 characters are rejected or trimmed (developer picks one and tests it).
- [ ] `DELETE /llm/conversations/{id}` hard-deletes the conversation and all its messages (test asserts no `ConversationMessage` rows remain for that ID).
- [ ] `POST /llm/conversations/bulk-delete` with a list of IDs deletes only the caller's conversations; foreign and unknown IDs are ignored, and the response reports how many were deleted.

Privacy and authorization
- [ ] User A's conversation returns 404 (not 403) to user B on `GET`, `PATCH`, `DELETE` and as `conversation_id` on `/llm/chat`, when B is a gabai and when B is an admin.
- [ ] `GET /llm/conversations` for user B never includes user A's conversations.
- [ ] A congregant gets 403 on every `/llm/conversations` route and on `/llm/chat` (unchanged router rule, see risks).
- [ ] Every service method filters by `user_id` in the DB query itself, not after loading (reviewer check).
- [ ] Unauthenticated requests get 401.

Schema
- [ ] New `app/modules/llm/models.py` with `Conversation` (`id`, `user_id` plain string with no FK to `auth`, `title`, `created_at`, `updated_at`, index on `user_id, updated_at`) and `ConversationMessage` (`id`, `conversation_id` FK inside the module with cascade delete, `role`, `content`, `actions` JSON, `created_at`).
- [ ] Models are imported in `app/modules/llm/module.py`; an Alembic revision exists; `alembic upgrade head` on an empty SQLite file succeeds and `alembic check` reports no drift.
- [ ] Existing `tests/test_llm*.py` still pass.

Frontend (slice 2)
- [ ] `conversationsApi` (list, get, rename, remove, bulkRemove) lives in `frontend/src/api/client.ts`; `llmApi.chat` accepts and returns `conversationId`. No direct `fetch`.
- [ ] Server state uses TanStack Query keys `['conversations', q]` and `['conversation', id]`; the send mutation shows the user message immediately and invalidates both keys on settle. The panel context holds only UI state (open, active ID, last ID in `localStorage`), no messages.
- [ ] The assistant panel has a history view: "new chat" button, title search, date groups (today, yesterday, last 7 days, older), inline rename, delete with a confirm `Modal`, select mode for bulk delete, `EmptyState` when there are no chats.
- [ ] The conversation view has a back-to-list control and shows the title in the header.
- [ ] `/chat` shows two panes (list beside the conversation) on wide screens and a single pane on mobile.
- [ ] Every action shows loading and a success or error `Toast`; only `components/ui/` primitives and the v2.2.5 tokens are used.
- [ ] `npm run lint`, `npm run build`, `npm test`, `npm run design:check` pass.
- [ ] Playwright at 375, 768 and 1280px: create a chat, reload and it is still there, switch chats, rename, delete, bulk delete; log in as a second user and see none of them; no console errors and no horizontal scroll.

## Out of scope
- Pin, share and export conversations (B-008).
- Page-aware assistant context, "ask about this congregant" (B-009).
- Retention policy with auto-delete after N days (B-010).
- LLM-generated titles (B-011).
- The side panel itself, header toggle and layout behavior (v2.2.5 F4b).
- Admin oversight or audit access to other users' chats (rejected in `DECISIONS.md`, 2026-11-03).
- Opening the assistant to the congregant role.

## Risks and open questions
- Schema change: two new tables and an Alembic migration in the llm module. Approved with the plan per `ROADMAP.md`; the owner confirms by approving this spec.
- Congregant role: the llm router has `dependencies=[Depends(require_operational)]` and each route uses `require_operational_scope`, both `require_roles(ADMIN, GABAI)`. So today only admin and gabai can call `/llm/chat`, and a congregant gets 403, even though `specs/llm-assistant.md` describes congregant-scope `my_*` tools. The new routes keep the same rule. Owner decision: confirm congregants stay out of v2.2.6. Opening the assistant to congregants is an authz change and would be a separate spec.
- N (messages sent to the LLM): proposed 20 (10 exchanges), as a module constant, not in `.env` or `TenantConfig`. Owner decision: confirm 20. Tool-call results are not stored as separate messages, so only `role` and `content` of stored turns are replayed, and `actions` are for display only.
- Plain `/llm/chat` without `conversation_id`: the plan says it "keeps working" and also that `chat()` creates a conversation when the ID is missing. Owner decision: should every chat without an ID create a saved conversation (proposed, so the panel never loses a first message), or should only clients that opt in be saved? `/llm/action` does not create one in either case.
- Partial turns: if the LLM call fails, is the user message kept (user can retry) or rolled back? Proposed: write both turns in one transaction after the reply, so a failed call stores nothing.
- Retention: conversations are kept until the user deletes them. Auto-delete is backlog B-010. Database size grows with use; there is no cap per user in this milestone.
- Personal data: stored messages and the `actions` JSON can include congregant names, phone numbers, payment amounts and yahrzeit dates that tools returned. This data now sits in a second place, outside the congregant record, and is not covered by congregant archiving. Mitigations in scope: owner-only access, real hard delete. Not in scope: encryption at rest, redaction of tool results. Owner decision: should `actions` store full tool `result` payloads, or only tool name and arguments (smaller, less personal data, but the UI cannot re-render results)?
- Deactivated users: `User.is_active` exists and an inactive user fails authentication (401), so their conversations become unreachable but stay in the DB. There is no user delete or deactivate endpoint today. Because `user_id` is a plain string with no FK, nothing cascades. Owner decision: keep orphaned conversations (proposed for now, revisit with B-010), or delete them when a user is deactivated (would need a `hooks` event from auth, which does not exist yet).
- Concurrency: two tabs writing to the same conversation interleave messages. Accepted; order is by `created_at`.
- Migration on PostgreSQL target: `actions` JSON column type must work on both SQLite and PostgreSQL (reviewer check).

## Slices
Ordered, each shippable on its own.
1. Backend (can run in parallel with v2.2.5 F1 to F4, no shared files): `app/modules/llm/models.py`, import in `module.py`, Alembic revision, owner-scoped service methods (`list_conversations`, `get_conversation`, `create_conversation`, `rename_conversation`, `delete_conversation`, `bulk_delete_conversations`), `chat()` with optional `conversation_id` that loads the last N messages and persists both turns, routes `GET /llm/conversations`, `GET/PATCH/DELETE /llm/conversations/{id}`, `POST /llm/conversations/bulk-delete`, `conversation_id` on `POST /llm/chat`. Tests in `tests/test_llm_conversations.py`; existing `tests/test_llm*.py` pass. One line in `docs/agent/backend.md` LLM section; `CHANGELOG.md` entry.
2. Frontend (starts after v2.2.5 Gate 2 approves the panel): `conversationsApi` and `llmApi.chat` changes in `client.ts`, TanStack Query hooks, history view and conversation view in `AssistantPanel`, two-pane `/chat`, toasts and confirm modal, Playwright checks at three widths. `CHANGELOG.md` entry; tick v2.2.6 in `ROADMAP.md` when both slices are done.
