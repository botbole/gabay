# Workflow

One person holds every role (customer, PM, developer, tester, ops). Roles are separated by time slots, and work is handed over through files, not chat history.

## Roles

The coordinator is the main chat agent, guided by `AGENTS.md`. In the full lane it delegates to subagents in `.claude/agents/` (Claude Code reads only this folder; Cursor reads it too); small-lane changes are done by the coordinator itself (see "Lanes"). The `/run-phase` skill is in `.claude/skills/run-phase/`:

| Role | Does | Edits |
|---|---|---|
| `pm` | Challenges the request, writes the spec, slices it, updates backlog and decisions | `docs/product/**` and `CHANGELOG.md` when asked |
| `developer` | Implements one approved slice with tests | code and tests |
| `tester` | Verifies the slice against acceptance criteria | read-only |
| `reviewer` | Reviews the diff against the hard rules | read-only |

Subagents start with no context. The coordinator always passes the spec path, the slice, the acceptance criteria and the files in scope.

## Specs, roadmap and backlog

Three files, three levels. They do not replace each other.

| File | Level | Answers |
|---|---|---|
| `ROADMAP.md` | Phases and features (the plan) | What exists in the long term, and which phase is done? |
| `BACKLOG.md` | Ranked waiting line (ideas, bugs, gaps) | What should be picked next, and how urgent is it? |
| `specs/<feature>.md` | One feature in detail | Who needs it, and what "done" means? |

- The roadmap is the committed plan. A backlog row is not "pushed" into the roadmap when you decide to build it; it is picked and built. The roadmap changes only when a phase is finished, when a big item is added to a phase, or when the owner creates a new phase (rare).
- Backlog rows usually name the phase they belong to (for example B-001 is v2.3). An idea with no phase may need a roadmap decision before a spec.
- A feature that grows in a later phase keeps one spec and adds a slice. A later change to a `done` feature is a new spec that points at the done one (for example `specs/pledge-paid.md` after `specs/payments.md`). Architecture that is not a feature goes in `DECISIONS.md`, not in a spec.

## Bugs, gaps and ideas (triage)

| Kind | Where | Handling |
|---|---|---|
| Small bug (fits the small lane) | Optional backlog row, or fix now | Small lane: coordinator fixes it directly, owner check, PR. No spec, no subagents. |
| Bug that blocks real use (pain 3) | `BACKLOG.md` type `bug` | Fix now on `fix/<name>`. Small lane if it fits, otherwise full lane without a new spec: developer, then tester and reviewer, then PR. |
| Small gap (missing sort, validation) | `BACKLOG.md` type `gap` | Ranked; pick when convenient. Spec only if it grows. |
| Big gap (needs schema, auth, money or several screens) | `BACKLOG.md` type `gap`, then a spec | Treat as a feature. Put it under the phase it belongs to, or ask the owner if no phase fits. |
| New idea | `BACKLOG.md` type `idea` | Ranked first. Joins a phase only if the owner decides it fits. Spec before building. |

Rule of thumb: fits the small lane → small (no spec, no subagents). Otherwise → big (full lane, spec). If unsure, treat it as big.

Bugs found by `tester` or CI during the current slice go back to `developer` in the fix loop. Only bugs outside the current slice are logged in the backlog.

## Flow for work already built

Features that shipped before this workflow (v1 to v3.0 steps 0-3) each have a spec with status `done`.
1. One spec per shipped feature, with the phase in `Roadmap item`.
2. Growth in a later phase is a shipped slice on the same spec.
3. Settled choices go to `DECISIONS.md`.
4. A real gap inside a shipped feature goes to the backlog (for example B-005, SMTP for the bulletin).
5. `ROADMAP.md` status is not changed, nothing is rebuilt, and no new tests are written for this.

## Flow for the next change

Example: pledge vs paid is backlog row B-001, belongs to phase v2.3, and has the spec `specs/pledge-paid.md`.
1. **Waiting line.** A new idea, bug or gap goes to `BACKLOG.md` first, ranked, with a type and a phase when known. No spec yet. Items already on the roadmap or the backlog start at step 2.
2. **Pick one.** One backlog row, or one item already listed under a phase in `ROADMAP.md`. Both are valid sources; the roadmap is the plan, the backlog is the ranked order.
3. **Spec.** Full lane only: `pm` writes one feature spec, status `draft`, naming the phase, cut into slices of one or two days. The owner approves it. No code yet. Small-lane changes skip steps 3 to 5 and follow "Lanes" above.
4. **Build one slice.** `developer` writes the code and that slice's tests together. `tester` checks the acceptance criteria and `reviewer` checks the rules, in parallel.
5. **Close the slice.** Changelog line; decisions if a real choice was made. The next slice starts again at step 4.
6. **Phase.** When every item in the phase is finished, mark it done in `ROADMAP.md`. A brand-new phase is an owner decision made before step 3, and it is rare.

Ideas that show up during step 4 go to the backlog and do not enter the current slice.

## Weekly rhythm

1. **Plan** (30-60 min, start of week). Pick 1-3 items from `BACKLOG.md` or `ROADMAP.md`. Use the `pm` agent to write a spec for each item. Review and approve the spec. No coding.
2. **Build** (rest of week). Coordinator runs developer, then tester and reviewer in parallel, one slice at a time. Work in progress: one slice.
3. **Review** (30 min, end of week). Use the feature as a real gabai would. Decide: ship, fix or drop. Update `CHANGELOG.md` and `DECISIONS.md`. Push. Every 2-3 weeks, show it to one or two real gabbaim.

Ideas that appear while building go to `BACKLOG.md`. They do not change the current slice.

## Lanes: small (default) and full

Every change starts by picking a lane. The coordinator states the choice in one line; the owner can override it. `AGENTS.md` holds the short version of this rule.

**Small lane (default).** All of these hold: one module or one page, about 3 files or fewer, no schema change, no auth/authz change, no new dependency, no new endpoint or LLM tool, no money (payments) logic. Examples: bug fix, UI text or styling, validation rule, new field on an existing form.
- The coordinator makes the change directly in the main chat. No spec, no `pm`, no subagents (`developer`, `tester`, `reviewer`).
- The touched module's tests (backend) or `npm run lint` and `npm run build` (frontend) must pass. Add a test for new behavior.
- The owner checks the result, then it goes to a PR. Log it in `CHANGELOG.md` only if users notice it.
- If it turns out to be bigger, stop and switch to the full lane.

**Full lane.** A new feature or module, or anything touching schema, auth/authz, money, the LLM tool surface or a new dependency, or when the owner says "phase", "slice" or `/run-phase`. Use the flow below: spec, approval, `developer`, then `tester` and `reviewer` in parallel.

If unsure, ask which lane. Anything on the "ask before" list in `AGENTS.md` is never small.

## Definition of Ready (before building)
- Spec exists in `docs/product/specs/` with status `approved`.
- Acceptance criteria are testable.
- Schema, auth and dependency decisions are answered by the owner.
- A schema change has its own Alembic revision, reviewed by a human, and the owner approves the spec's schema section before `developer` runs or applies it.
- The approved spec is committed on `main` before `feat/<name>` is created (or committed on the feature branch itself), so `developer` finds it on the branch.
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
- Commit at the end of each accepted slice, explicit paths, small commits. Never start the next slice before the previous one is committed, so `tester` and `reviewer` see only one slice in `git diff`. Never mid-slice or with failing tests. Never commit `.env` or `gabay.db`.
- Push after each accepted slice and always at the weekly review.
- Agents commit and push only when asked. Check `git status` first.
- Tag a version when a roadmap milestone completes (once deployment exists).
- Committed with the project: `.claude/agents/`, `.claude/skills/`, `.cursor/rules/`, `.cursor/skills/`, `docs/product/`, `AGENTS.md`, milestone plans in `.cursor/plans/`, and `.cursor/mcp.json` when it is an empty stub. Not committed: `graphify-out/`, `.env`, `gabay.db`, and any MCP file that contains keys.
