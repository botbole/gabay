# Aliyot

Status: done
Roadmap item: v1
Owner: eran

Retrospective spec, written after the feature shipped. Sources: `ROADMAP.md`, checked items in `docs/ROADMAP_HE.md` (Milestone 1, testing), `docs/PRD_Gabay.md` section 4.4.

## Problem
Torah aliyot were assigned from memory or on paper. The gabai could not see who got which aliyah for a parasha or how often a person was called up.

## User story
As a gabai, I want to assign aliyot per parasha and see each congregant's aliyah history, so that I distribute honors fairly and track donations tied to them.

## Acceptance criteria
- [x] Assign an aliyah: congregant, parasha, aliyah type (first through maftir), date, custom, donation, notes.
- [x] View aliyot by parasha.
- [x] Aliyah history per congregant, also shown in the congregant detail panel.
- [x] An aliyah with a donation amount records the matching payment; no donation, no payment.
- [x] Bulk delete.
- [x] Integration tests cover assign, history and the automatic donation.

## Out of scope
- Aliyah suggestion algorithm and `suggest_aliyot` (v2.4).

## Risks and open questions
- None open.

## Slices
1. v1, shipped: model, assign, views by parasha and by congregant, Aliyot page.
