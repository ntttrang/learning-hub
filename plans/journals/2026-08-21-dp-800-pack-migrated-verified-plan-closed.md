---
title: "dp-800 pack migrated, verified, plan closed"
date: 2026-08-21
summary: "DP-800 donor content now a validated hub pack across six delivered phases, verified end to end"
---

# dp-800 pack migrated, verified, plan closed

## What happened

Executed the full dp-800 pack migration plan (six phases, all committed):

- Enabling seams: extension-renderer registration, engine labels,
  `importLegacyData` full-field extension (dcf2d8f, 8fb9b1b lineage).
- Extractor (`scripts/extract-dp800-pack.ts`) emits `content/dp-800/`
  (3 domains / 11 modules / 43 lessons / 179 questions / 3 labs /
  2 fixed mock exams / 4 comparisons, 228 files) plus docker assets under
  `public/dp-800/docker/` — 8 donor files byte-identical + 1 authored
  safety README.
- Parity pins: fixed-paper golden ids, sideBySide≡comparisons identity,
  engineLabel columns, lab-coding hygiene (421d46e).
- Progress migration: one-shot `dp800-store` → `cc-subject-data` import,
  hub-wins per key, durability-verified guard, unknown-id hygiene
  (18a79d7).
- End-to-end verification: all gates green (542/542 tests, 5-pack
  content:check, lint, build with mermaid async-only — the sole import
  site is `await import('mermaid')`), extractor re-run byte-identical,
  donor untouched, walkthrough checklist mapped to machine evidence
  (bb3c226).

## Decision

- Redacted the donor's lab-local sa password from the scout report
  before landing the plan directory — repo rule (never commit
  credentials) overrides the plan's throwaway-lab-credential threat
  model for anything the hub repo tracks.
- One automation gap stays a human item: real in-browser mermaid
  rendering across Auto/Light/Dark/Night (jsdom cannot run the library;
  the wrapper contract is tested against a mocked boundary). A `<pre>`
  fallback in a healthy render would be a bug.
- Four user-approved parity deltas recorded in the verification report:
  lab-coding cards not ported, no in-app setup page (safety README
  instead), donor compare→lesson links dropped, theme/achievements/
  streak not migrated.

## Next steps

- Human eyeball pass: four-theme mermaid render + contrast.
- Roadmap Phase 5+ per docs/unified-learning-hub-plan.md.
- Watch the unrelated `learn-gh-200` submodule-pointer drift surfaced
  during the final commit (not touched by this work).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
