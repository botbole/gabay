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

## Specs, roadmap and backlog

- A **spec** is one feature: who needs it and what "done" means (for example `specs/payments.md`).
- The **roadmap** (`ROADMAP.md`) is the phase each feature belongs to and whether the phase is finished. A phase is a group of features; the spec's `Roadmap item` field names it.
- The **backlog** (`BACKLOG.md`) is the waiting line for what to pick next.

A feature that grows in a later phase keeps one spec and adds a slice. A later change to a `done` feature is a new spec that points at the done one (for example `specs/pledge-paid.md` after `specs/payments.md`). Architecture that is not a feature goes in `DECISIONS.md`, not in a spec.

## Flow for work already built

Features that shipped before this workflow (v1 to v3.0 steps 0-3) each have a spec with status `done`.
1. One spec per shipped feature, with the phase in `Roadmap item`.
2. Growth in a later phase is a shipped slice on the same spec.
3. Settled choices go to `DECISIONS.md`.
4. A real gap inside a shipped feature goes to the backlog (for example B-005, SMTP for the bulletin).
5. `ROADMAP.md` status is not changed, nothing is rebuilt, and no new tests are written for this.

## Flow for the next change

Example: pledge vs paid is backlog row B-001, belongs to phase v2.3, and has the spec `specs/pledge-paid.md`.
1. **Waiting line.** A new idea goes to `BACKLOG.md` first, ranked. No spec yet. Items already on the roadmap or the backlog start at step 2.
2. **Pick one.** One backlog row, or one item already listed under a phase in `ROADMAP.md`.
3. **Spec.** `pm` writes one feature spec, status `draft`, naming the phase, cut into slices of one or two days. The owner approves it. No code yet.
4. **Build one slice.** `developer` writes the code and that slice's tests together. `tester` checks the acceptance criteria and `reviewer` checks the rules, in parallel.
5. **Close the slice.** Changelog line; decisions if a real choice was made. The next slice starts again at step 4.
6. **Phase.** When every item in the phase is finished, mark it done in `ROADMAP.md`. A brand-new phase is an owner decision made before step 3, and it is rare.

Ideas that show up during step 4 go to the backlog and do not enter the current slice.

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
- Committed with the project: `.cursor/agents/`, `.cursor/rules/`, `.cursor/skills/`, `docs/product/`, `AGENTS.md`, milestone plans in `.cursor/plans/`, and `.cursor/mcp.json` when it is an empty stub. Not committed: `graphify-out/`, `.env`, `gabay.db`, and any MCP file that contains keys.
