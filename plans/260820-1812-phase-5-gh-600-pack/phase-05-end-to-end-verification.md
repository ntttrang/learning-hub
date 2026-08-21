---
phase: 5
title: "End-to-end verification"
status: completed
priority: P2
effort: "0.5d"
dependencies: [4]
---

# Phase 5: End-to-end verification

## Overview

Prove the finished pack against the roadmap Phase 5 acceptance line — *GH-600 exams + study
plan + labs run through the shared engines* — then close out with docs and a clean commit.

## Requirements

- Functional: every enabled mode works in the running app for `gh-600` alongside the existing
  packs; platform-wide gates green.
- Non-functional: no regressions in gh-200/gh-900/fixture; docs updated only where
  user-visible facts changed.

## Architecture

Verification ladder (development-rules: narrowest useful test first, broaden on shared
contracts — this phase touches no shared code, so the ladder is: pack gates → full suite →
build → manual render):

1. `npm run content:check` — all four packs validate.
2. `npm test` — full suite (parity, shim, converter, existing suites).
3. `npm run lint` && `npm run build`.
4. Manual dev-server pass (`npm run dev`), checking:
   - hub home lists GH-600 with `deep-teal` accent + beta disclaimer (the card replaces the
     `hub-coral` placeholder — visible change, plus dp-800 becomes the only
     "Pack not installed" entry);
   - `learn`: 6 domains → module → 23 lessons; tables/callouts/code render; prev/next nav;
   - `practice`: per-domain quiz with explanations;
   - `exams`: 8 exams listed with 120/90-min durations + 700 pass mark; sit a practice exam
     end-to-end (submit → score → review with explanations);
   - `labs`: 8 labs render steps + checks;
   - progress + SRS + notes write under the `gh-600` namespace (no cross-subject bleed);
   - Auto/Light/Dark/Night themes and keyboard nav on the GH-600 workspace.
5. Docs: update the smallest owning surface only — wherever installed subjects are listed
   (README/docs navigation); no evergreen churn (documentation-management rule).
6. Conventional commit, no AI references (`feat(content): add gh-600 pack …`), donors
   untouched.

## Related Code Files

- Modify: README/docs subject list (one line, if a list exists)
- Modify: none under `src/` (verification only; any fix found loops back to the owning phase)

## Implementation Steps

1. Run the ladder top to bottom; record outcomes in the session, not new reports.
2. Manual pass with the checklist above; screenshot only if a defect needs reporting.
3. Docs line + commit.

## Success Criteria

- [x] All four gates green (`content:check`, `test`, `lint`, `build`).
- [x] Exam sat end-to-end through the real engines (paper 60q, perfect 1000/pass, blank 100/fail, per-domain 10/14/7/10/10/9); render surfaces covered by the suite (home-card install state, pack validation through the glob source) and a live dev-server HTTP pass.
- [x] gh-200/gh-900 unaffected (their parity suites are part of `npm test`).
- [x] Committed with a conventional message; working tree clean apart from pre-existing changes.

## Risk Assessment

- **Late defects found manually** (rendering, nav, namespace bleed): route back to the owning
  phase file and fix at the source; do not patch emitted JSON by hand — regenerate via the
  extractor so parity stays authoritative.
- **Perf:** ~418 new JSON files (390 questions + 23 lessons + 5 root files) through the glob
  loader — gh-200/gh-900 already ship 265 content files combined and load fine; the repo goes
  to ~700 eager modules. If dev-server startup degrades measurably, raise as a follow-up
  (Vite glob eager-parsing is the known lever; not this phase's scope).
