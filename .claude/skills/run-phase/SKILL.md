---
name: run-phase
description: Run the Gabay role workflow for a phase, feature or slice (pm spec, approval, developer, tester and reviewer). Use when the user types /run-phase or asks to run the full workflow.
disable-model-invocation: true
---

# Run phase

Input: a roadmap item, backlog ID, or spec path.

0. Lane check. If the input fits the small lane (rule: `docs/product/WORKFLOW.md`, "Lanes"), say so in one line and ask the user whether to do it directly instead. Continue below only if they want the full flow or it is not a small change.

1. If no approved spec exists, delegate to `pm` to write `docs/product/specs/<feature>.md`. Pass it the request and tell it to read `ROADMAP.md` and `docs/product/BACKLOG.md`, and any plan in `.cursor/plans/` for the item. Then stop and ask the user to approve the spec and answer open decisions. A plan or a roadmap line is not an approval.
2. After approval, set the spec status to `in progress` if this is its first slice. Delegate one slice to `developer`. Pass the spec path, the slice, the acceptance criteria and the files in scope. Never run two developers on the same files at once.
3. Run `tester` and `reviewer` in parallel on the result. Pass each the spec path, slice and acceptance criteria.
4. If either reports problems, send them back to `developer`. After two failed rounds, stop and report to the user.
5. When both pass, summarize for the user: what changed, results, open items.
   - If the slice touches auth/authz, money or the schema, ask the user to run the second reviewer on another company's model and paste the report. Its fixes count toward the same two rounds.
   - Ask the user for the gabai pass (accepted, fix or drop) and record the result in the spec's "Gabai pass" section.
   - Propose a `CHANGELOG.md` line, and write it only after the owner accepts the slice. When the last slice is accepted, set the spec status to `done`.
   - Do not commit or push unless asked. When asked to push slice 1, offer to open a draft PR so CI runs on later pushes.
