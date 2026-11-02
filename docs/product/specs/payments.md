# Payments

Status: done
Roadmap item: v1
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 1), `docs/PRD_Gabay.md` section 4.3.

## Problem
Membership fees and donations were tracked in spreadsheets. The gabai could not see a person's payment history or who had not paid for a given purpose.

## User story
As a gabai, I want to record payments per congregant and see who has not paid, so that I know what was collected and from whom.

## Acceptance criteria
- [x] Record a payment for a congregant: amount, currency, purpose, date, notes.
- [x] A payment row means money received.
- [x] Payment history per congregant, also shown in the congregant detail panel.
- [x] Pending list: congregants who have not paid for a given purpose.
- [x] Bulk delete of payments.
- [x] Dashboard shows total donations.
- [x] Integration tests cover record, history and pending list.

## Out of scope
- Pledge vs paid status. Next change: `docs/product/specs/pledge-paid.md` (v2.3, draft).
- PDF receipts, expenses, other income and the annual report (v2.3).
- Multi-currency totals (open question in the PRD).

## Risks and open questions
- Every total that sums payments assumes money received. The pledge spec must update those totals and the LLM payment tools.

## Slices
1. v1, shipped: model, record, history, pending list, bulk delete, Payments page.
