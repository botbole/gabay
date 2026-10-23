# Workflow

One person holds every role (customer, PM, developer, tester, ops). Roles are separated by time slots, and work is handed over through files, not chat history.

## Roles

The coordinator is the main chat agent, guided by `AGENTS.md`. It delegates to subagents in `.cursor/agents/`:

| Role | Does | Edits |
|---|---|---|
| `pm` | Challenges the request, writes the spec, slices it, updates backlog and decisions | `docs/product/**` only |
| `developer` | Implements one approved slice with tests | code and tests |
| `tester` | Verifies the slice against acceptance criteria | read-only |
| `reviewer` | Reviews the diff against the hard rules | read-only |

Subagents start with no context. The coordinator always passes the spec path, the slice, the acceptance criteria and the files in scope.

## Weekly rhythm

1. **Plan** (30-60 min, start of week). Pick 1-3 items from `BACKLOG.md` or `ROADMAP.md`. Run `/pm <item>`. Review and approve the spec. No coding.
2. **Build** (rest of week). Coordinator runs developer, then tester and reviewer in parallel, one slice at a time. Work in progress: one slice.
3. **Review** (30 min, end of week). Use the feature as a real gabai would. Decide: ship, fix or drop. Update `CHANGELOG.md` and `DECISIONS.md`. Push. Every 2-3 weeks, show it to one or two real gabbaim.

Ideas that appear while building go to `BACKLOG.md`. They do not change the current slice.

## Definition of Ready (before building)
- Spec exists in `docs/product/specs/` with status `approved`.
- Acceptance criteria are testable.
- Schema, auth and dependency decisions are answered by the owner.
- The slice fits one or two days.

## Definition of Done (per slice)
- All acceptance criteria pass (tester report).
- Reviewer returns APPROVE.
- Touched module's tests pass; frontend changes pass `npm run lint` and `npm run build`.
- `CHANGELOG.md` has a line; non-obvious choices are in `DECISIONS.md`.
- `ROADMAP.md` updated only when a whole milestone item completes.

## Chats
Start a fresh chat per feature or slice, or when a chat gets long. The handoff is the files: for example "continue slice 2 of `docs/product/specs/pledge-paid.md`".

## Git
- Branch per feature (`feat/<name>`), merge to `main` by PR, even solo.
- Commit at the end of each accepted slice, explicit paths, small commits. Never mid-slice or with failing tests. Never commit `.env` or `gabay.db`.
- Push after each accepted slice and always at the weekly review.
- Agents commit and push only when asked. Check `git status` first.
- Tag a version when a roadmap milestone completes (once deployment exists).
- Committed with the project: `.cursor/agents/`, `.cursor/rules/`, `.cursor/skills/`, `docs/product/`, `AGENTS.md`. Not committed: personal tool config (`.cursor/mcp.json` if it holds keys), `.cursor/plans/`, `graphify-out/`.
