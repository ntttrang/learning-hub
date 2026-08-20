---
title: "Phase 3: GH-200 pack"
status: done
---

# Phase 3: GH-200 pack

## Overview

Land the second pack with the proven extractor: `gh200` — 5 domains, 41 subSkill
modules, 5 lessons, 100 questions, 6 labs, 2 sampled exams, **plus the two
comparisons** (`actions-vs-jenkins`, `actions-vs-aws`) and the living-lab repo
doc links unique to this subject. Roadmap Phase 3's done-condition ("both GitHub
subjects fully usable; parity with the old app") becomes true at the end of this
phase, pending Phase 4's parity proof.

## Requirements

- [x] `npm run content:extract-gh -- --cert gh200` emits `content/gh-200/**`
      (112 files) passing `content:check`
- [x] `subject.json`: `id: 'gh-200'`, `code: 'GH-200'`,
      `title: 'GitHub Actions'`, `subtitle: 'GitHub Actions · 5 domains'`
      (corrected count — placeholder text wrongly says "4 domains"),
      description verbatim from the placeholder, `accent: 'hub-green'`,
      `enabledModes: ['learn','labs','practice','exams','compare','notes','revision']`
      — from the extractor's `SUBJECT_META` (Phase 1)
- [x] `comparisons.json`: both datasets as N-column shape —
      `columns: [{id:'github', label:'GitHub Actions'}, {id:'other', label: <counterpart>}]`,
      10 rows each, cell text verbatim
- [x] gh-200 `docs.json` contains `repo-deploy-workflow` and `repo-actions-runs`
      (living-lab links from `gh200-lab-06`) — they arrive via the referenced-id
      scan, not hand-adds
- [x] Compare tab renders both datasets; `[label](docId)` links inside compare
      cells and lab steps resolve to real URLs
- [x] `views.test.tsx` "Pack not installed" count 3 → 2 (dp-800 + gh-600
      remain) — same commit; only the count assertion hard-fails CI, rewrite
      any remaining gh-200 placeholder assertions for hygiene
- [x] Gates: `npm test`, `npm run lint`
- [x] **Bundle-size measurement** (finding L): `npm run build` after the
      second pack; record both-pack total vs the Phase 2 checkpoint and the
      fixture-only baseline; note in the close-out whether the eager-glob
      growth justifies a lazy-glob redesign (deferred by default — measurement
      first, redesign only on evidence)

## Architecture

Same generate → validate → repair loop as Phase 2, plus the two gh-200-only
mappings (comparison columns; nothing else new). The docs partition for gh-200
is expected to be larger than gh-900's (comparisons + living-lab prose carry
extra ids) — dry-run partition sizes from Phase 1 confirm the split before any
write. `enabledModes` includes `compare` because `comparisons` is non-empty
(the `mode-without-content` check would reject it otherwise).

## Related Code Files

- Create: `content/gh-200/subject.json`, `domains.json`, `modules.json`,
  `docs.json`, `labs.json`, `exams.json`, `comparisons.json`,
  `lessons/*.json` (5), `questions/*.json` (100) — all generated
- Modify: `src/shell/views.test.tsx` (final placeholder count)
- Modify (only if fallout demands): `scripts/extract-gh-packs.mts`

## Implementation Steps

1. Dry-run `--cert gh200`; confirm counts (112) + docs-partition size against
   the Phase 1 baseline.
2. Extract into `content/gh-200/`; `content:check` until green.
3. Spot-check fidelity: both comparisons (column labels = counterpart strings),
   one multi + one order + one fill question, one lab with repo links.
4. Update `views.test.tsx`; run `npm test` + `npm run lint`.
5. `npm run build`; record bundle size against the Phase 2 checkpoint.
6. Manual smoke: all seven tabs incl. Compare tab; verify doc links in compare
   cells resolve (rendered anchors, not plain text).

## Todo

- [x] Dry-run counts confirmed
- [x] Extractor run + content:check green
- [x] Fidelity spot-check (comparisons + 3 questions + living-lab links)
- [x] views.test.tsx final count
- [x] Bundle size recorded vs Phase 2 checkpoint
- [x] Manual smoke incl. Compare
- [x] Gates green

## Success Criteria

- `content:check` green with `fixture` + `gh-900` + `gh-200` installed.
- GH-200 card installed; seven tabs render; compare matrix shows both
  GitHub-vs-X tables with working citations.
- Both subjects fully usable — roadmap Phase 3 done-condition met pending
  parity proof (Phase 4).
- `npm test` + `npm run lint` green.

## Risk Assessment

- **Comparison cell doc links silently degrade** (inline links are not
  hub-validated) → Phase 4's docs scan asserts every inline link resolves;
  manual smoke here catches the visual symptom early.
- **SubSkill id collisions** are impossible after the pack split (ids only
  domain-unique in source, packs are separate namespaces) — noted, no action.
- **Hand-edit temptation on compare cells** → same rule as Phase 2: mapping
  fixes in the extractor only.

## Execution Notes (2026-08-20)

Bundle measurement (finding L), continuing the Phase 2 checkpoint:

| Build | JS | gzip |
| --- | --- | --- |
| + gh-900 (Phase 2 checkpoint) | 1,297.11 kB | 372.36 kB |
| + gh-200 | 1,477.36 kB | 425.14 kB |

gh-200 pack JSON payload: 508 kB → JS growth 180.25 kB ≈ 0.35× the payload,
far under the ~2× threshold. Verdict: eager glob stands; lazy-glob redesign
stays deferred, recorded as decision data (final numbers in the Phase 6
close-out).

Docs-partition note: first extraction dropped `repo-deploy-workflow` (48
docs) — the inline-link scan bug recorded in Phase 1's execution notes; fixed
via donor `extractDocIds` semantics, gh-200 docs 48→49.
