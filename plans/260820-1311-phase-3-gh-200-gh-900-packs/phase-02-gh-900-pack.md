---
title: "Phase 2: GH-900 pack"
status: done
---

# Phase 2: GH-900 pack

## Overview

Land the first real pack: run the Phase 1 extractor for `gh900`, review the
generated files, fix validation fallout, and update shell test expectations in
the same change. GH-900 is the pilot subject — 7 domains, 34 subSkill modules,
7 lessons, 140 questions, 7 labs, 2 sampled exams, no comparisons. When this
phase closes, GH-900 is fully usable in the hub and the placeholder card is
replaced by the pack's own metadata.

## Requirements

- [x] `npm run content:extract-gh -- --cert gh900` emits `content/gh-900/**`
      (153 files) passing `npm run content:check` first try or after bounded fixes
- [x] `subject.json`: `id: 'gh-900'` (equals directory), `code: 'GH-900'`,
      `title: 'GitHub Foundations'`, `subtitle: 'GitHub Foundations · 7 domains'`
      (corrected count — placeholder text wrongly says "4 domains"),
      description verbatim from the placeholder, `accent: 'corgi-orange'`,
      `enabledModes: ['learn','labs','practice','exams','notes','revision']`
      (no `compare` — zero comparisons in source). Values come from the
      extractor's `SUBJECT_META` (Phase 1), not hand edits
- [x] Every lesson has `moduleId` (first subSkill of its domain) — prev/next
      nav present in LessonViewer
- [x] Hub home shows the GH-900 card as installed with real mode chips;
      placeholder card gone
- [x] Workspace smoke: Learn (lesson renders h3/p/code/list/tip/table blocks),
      Labs (7), Practice scopes by domain / subSkill / all, Exams (mock-a/b
      assemble 35 questions, 100 min, resume + review), Notes, Revision
- [x] `src/shell/views.test.tsx` "Pack not installed" count 4 → 3 — **same
      commit as the pack**. Only `:35` is a hard CI break; the gh-900
      placeholder assertions at `:51-63` don't fail CI (they match by card
      code), they rot — rewrite them for the installed-pack reality anyway
- [x] Existing suites green: `npm test`, `npm run lint`
- [x] **Bundle-size checkpoint** (finding L): record `npm run build` output
      size before this phase (fixture-only baseline) and after — packs are
      eager-globbed, so growth is the data for the lazy-glob decision later;
      note the number in the phase close-out. Threshold worth redesign:
      total JS grows by more than ~2× the pack JSON payload

## Architecture

The extractor is deterministic, so this phase is generate → validate → repair
loop, not authoring. Expected validation fallout and their fixes:

| Symptom | Cause | Fix |
| --- | --- | --- |
| `unresolved-ref` on docs | docs partition missed an id | extend the referenced-id scan (never hand-add one id — fix the scan) |
| `unresolved-ref` module→domain | subSkill domainId mismatch | check extractor module emission |
| `unknown-question-kind` | kind name drift | map to the 7 registered kinds |
| `exam-infeasible` | domainPlan key typo / count > 20-pool | fix the plan emission, never the source values |
| id-schema failure | uppercase/underscore id | only option ids are synthesized (`o1..oN`) — verify |

All donor content values (prompts, options, counts, weights, minutes, seeds)
are copied verbatim — this phase changes representation, never content. If a
donor value fails hub validation, the extractor mapping is wrong; do not edit
the emitted JSON by hand (edits die on the next extractor run).

## Related Code Files

- Create: `content/gh-900/subject.json`, `domains.json`, `modules.json`,
  `docs.json`, `labs.json`, `exams.json`, `lessons/*.json` (7),
  `questions/*.json` (140) — all generated
- Modify: `src/shell/views.test.tsx` (placeholder-count + gh-900 assertions)
- Modify (only if fallout demands): `scripts/extract-gh-packs.mts`

## Implementation Steps

1. Run the extractor for gh900 into `content/`; `npm run content:check`.
2. Work the validation-error table above until clean; re-run after each fix.
3. Spot-check fidelity against donor (3 questions of different kinds + 1
   lesson): option order, correct answers, explanation text, block sequence.
4. Update `views.test.tsx` expectations; run full `npm test` + `npm run lint`.
5. Manual smoke (`npm run dev`): home card, all six tabs, one exam completed
   end-to-end incl. review screen, one practice session scoped to a subSkill.

## Todo

- [x] Extractor run + content:check green
- [x] Fidelity spot-check (3 questions + 1 lesson)
- [x] views.test.tsx updated in same change
- [x] Manual smoke all six tabs
- [x] Gates green

## Success Criteria

- `content:check` green with `fixture` + `gh-900` installed.
- GH-900 card shows installed; workspace tabs Learn/Labs/Practice/Exams/Notes/Revision.
- Lesson prev/next works; practice drills by subSkill; both exams produce
  35-question papers and review renders.
- `npm test` + `npm run lint` green.

## Risk Assessment

- **One bad value bricks listing during iteration** → Phase 1 isolation already
  landed; failures are contained and logged per pack.
- **Silent content drift from hand edits** → rule: no hand edits to generated
  files; mapping fixes go in the extractor.
- **views.test.tsx gh-900 assertions rot** → they are rewritten in the same
  commit (the `:35` count assertion *does* fail CI on stale expectations; the
  rest is hygiene).
- Signal the ordering assumption broke (Phase 4 catches it formally): a sampled
  paper's question list looks reordered → check file naming sort before
  proceeding.

## Execution Notes (2026-08-20)

Bundle-size checkpoint (finding L), `npm run build` output:

| Build | JS | gzip |
| --- | --- | --- |
| Fixture-only baseline (pre-pack; measured 2026-08-20 — no longer reproducible without moving packs out of `content/`) | 1,098.83 kB | 317.87 kB |
| + gh-900 | 1,297.11 kB | 372.36 kB |

gh-900 pack JSON payload: 660 kB → JS growth 198.28 kB ≈ 0.30× the payload,
far under the ~2× redesign threshold. Continues in Phase 3 and the Phase 6
close-out.
