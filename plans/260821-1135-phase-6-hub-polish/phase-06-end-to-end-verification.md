---
title: "Phase 6: End To End Verification"
status: todo
priority: P2
effort: 2h
dependencies: [phase-02, phase-03, phase-04, phase-05]
---

# Phase 6: End To End Verification

## Overview

Whole-hub verification of Phase 6: every gate green, a manual cross-theme
walkthrough of each new surface, confirmation that persisted data upgrades
cleanly from a pre-Phase-6 browser profile, and closure of the plan with a
journal entry.

## Requirements

- [x] `npm test`, `npm run lint`, `npm run build`, `npm run content:check` all
      green in one clean run.
- [x] Manual walkthrough (dev server, real browser):
  - ⌘K search: find a lesson in each of the four real packs + a placeholder;
  - `#/review`: mixed session across ≥2 subjects with due cards; finish;
    verify persisted decks moved (localStorage `cc-subject-data`);
  - hub home: stats band, per-subject progress, due chips, achievements
    strip, continue links;
  - achievements: trigger `first-lesson`-class award live; reload → persists;
  - scaffolder: `content:new` scratch run → visible + usable → deleted.
- [x] Theme matrix: Auto / Light / Dark / Night across search popover, review
      queue, dashboard band, rail badge; keyboard-only pass over the same
      surfaces; reduced-motion respected (no new animations beyond existing
      tokens).
- [x] **Profile-upgrade check:** a browser with pre-Phase-6 `cc-subject-data`
      (only streak + subjects) loads without errors, shows the migrated
      progress on the dashboard, and default-fills achievements — simulate by
      editing localStorage to the old shape in devtools.
- [x] No `console.error`/`console.warn` new to Phase 6 surfaces.
- [x] Plan phases checked off via `ak plan check`; journal entry written under
      `plans/journals/` per repo convention.

## Implementation Steps

1. Run the four gates; fix anything found (regression fixes only — no new
   behavior in this phase).
2. Manual walkthrough + theme/keyboard matrix; note and fix defects.
3. Profile-upgrade simulation; verify the `merge` default-fill path.
4. Commit any fixes; `ak plan check` each phase file to completed; confirm
   `ak plan status` shows the plan complete.
5. Write the journal entry (`plans/journals/2026-MM-DD-phase-6-hub-polish-….md`)
   covering: what shipped, the in-flight-search landing, deviations from the
   plan (if any), and known follow-ups for Phase 7 (CI/CD + deploy).

## Todo

- [x] All four gates green
- [x] Manual + theme + keyboard matrix pass
- [x] Old-profile upgrade check
- [x] Plan statuses closed + journal written

## Success Criteria

- Every Phase 6 surface works in every theme with keyboard only; a pre-Phase-6
  browser profile upgrades silently; the plan and journal record the phase as
  complete and the repo is committed clean.

## Risk Assessment

- **Risk:** old-profile simulation reveals the `merge` path misses a key
  (e.g. achievements nested wrong). *Signal:* console error or missing strip
  on the old-shape profile. *Response:* fix `merge` in `subject-store.ts` —
  that is the designed migration seam; no version bump needed (locked in
  plan.md).
- **Risk:** verification turns up UX rough edges (spacing, copy) tempting a
  redesign. *Response:* fix only defects; aesthetic iterations beyond the
  mockup language go to a follow-up, not this phase.
