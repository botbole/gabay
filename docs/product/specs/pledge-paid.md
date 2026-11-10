# Pledge vs paid

Status: draft
Roadmap item: v2.3 Financial completeness
Owner: eran

## Problem
A `Payment` row today means money received (`amount`, `purpose`, `date`). Donors often pledge (for example on an aliya or at Yom Kippur) and pay later. The gabai cannot record a pledge, see who still owes, or tell pledged from collected money. Today this lives in notes or a separate spreadsheet.

## User story
As a gabai, I want to record a donation as pledged or paid and mark a pledge as paid later, so that I always know what was promised, what was collected and who still owes.

## Success check
The gabai records pledges and payments only in the app and no longer keeps a separate notebook or spreadsheet of who owes. Finding who still owes takes under 10 seconds.

## Acceptance criteria
- [ ] A payment has a status: `pledged` or `paid`. Existing payments are treated as `paid` after migration.
- [ ] Creating a payment accepts a status; default is `paid` so existing clients keep working.
- [ ] A pledge can be marked as paid with a paid date; the action is allowed for `admin` and `gabai` only.
- [ ] The payments list can be filtered by status.
- [ ] A congregant's total donated counts only `paid`; pledged amounts are shown separately as outstanding.
- [ ] Payments page shows a status badge per row, a status filter, and a "mark as paid" action with loading and success/error feedback.
- [ ] Empty states exist for "no pledges".
- [ ] Unauthenticated requests get 401; `congregant` role gets 403 on mutations and sees only its own payments.
- [ ] LLM payment tools respect status (a pledge is not reported as money received).
- [ ] pytest covers create pledge, mark paid, filtering, totals, and role checks.

## Out of scope
- PDF receipts (separate slice).
- Reminders or WhatsApp messages for unpaid pledges.
- Partial payments and installment plans.
- Expenses, income and annual report.

## Risks and open questions
- Schema change: new `status` and `paid_date` columns on `payments` need an Alembic migration (needs owner approval before implementation).
- Decision needed: is a single `status` field on `Payment` enough, or should a pledge convert into a separate paid record? Proposed: single field, no partial payments, to keep slice small.
- Totals and LLM tools that sum payments must be found and updated; the developer should list every consumer first.

## Slices
1. Backend: model, migration, service, API, role checks, tests.
2. Frontend: status badge, filter, mark-as-paid action, outstanding total.
3. LLM tool and dashboard totals respect status.

## Gabai pass
- Slice 1: pending
- Slice 2: pending
- Slice 3: pending
