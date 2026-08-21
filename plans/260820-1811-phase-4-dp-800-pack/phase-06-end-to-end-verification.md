---
phase: 6
title: "End-to-end verification"
status: completed
priority: P1
effort: 0.5d
dependencies: [4, 5]
---

# Phase 6: End-to-end verification

## Overview

Close the loop: full gates, build inspection (mermaid must sit in an async
chunk, not the entry bundle), the hub home showing the installed dp-800 card,
the smallest owning docs surface updated (README "Installed packs" line —
user-visible behavior changed: a new subject exists), the donor tree verified
untouched, and a manual walkthrough of the DP-800 surfaces including the four
themes and the a11y pass. Also records the accepted parity deltas so reviewers
do not rediscover them: lab-coding set cards/sourceUrl not ported (module-scope
practice covers the drill path), no in-app /setup page for the bundled docker
environment (roadmap candidate; the donor's "(see the Setup page)" prerequisite
string is amended at extraction to point at the bundled environment —
validation session 1), donor
compare→lesson "Full lesson" links not ported (no lesson back-ref in the hub
Comparison schema; the lessons→comparison direction survives via sideBySide
blocks), donor achievements/theme/streak not migrated.

## Requirements

### Functional

- Gates all green: `npm test`, `npm run content:check` (4 packs), `npm run
  lint`, `npm run build`, `npm run content:extract-dp800 -- --dry-run` (echoed
  counts 3/11/43/179/3/2/4 + 8 copied docker files + 1 authored safety README)
  and a re-run of the extractor
  without flags leaves `git status` clean (byte-identical emission).
- Build inspection: `dist/` chunk map shows `mermaid` only in a lazy/async
  chunk; the entry chunk grew only by the empty-renderer-seam + engine-labels
  delta. Record the bundle numbers in the phase report (gh phase-3 precedent:
  eager-glob growth is decision data).
- Hub home: dp-800 card present with the sky-cyan accent, title
  "Developing AI-Enabled Database Solutions", 7 modes; gh-900 / gh-200 / fixture
  cards unchanged.
- Docs: update the README "Installed packs" sentence (`README.md:37-38`) to
  name DP-800 alongside GH-900 and GH-200, and mention the one-time dp-800
  progress import next to the existing gh import sentence (`README.md:39-41`).
  Docker-environment discoverability needs no README.md sentence (validation
  session 1): the amended prerequisite string points at
  `public/dp-800/docker/`, where the authored safety README lives — still the
  smallest owning surface. No other docs churn (roadmap doc is a
  plan record, not a status board).
- Donor untouched: `git -C learn-dp-800 status` clean; `learn-dp-800/` was
  never written to.
- Manual walkthrough (dev server, checked off in the phase report):
  - Learn: open l0103 (flagship — objectives, key terms, sourced concepts,
    mermaid figure, sideBySide block, lab link, knowledge check, references
    with raw URLs resolving); prev/next navigation; mark complete.
  - Labs: lab-rls — pretty engine labels ("Microsoft SQL, PostgreSQL, Oracle"),
    schema/seed blocks, 4 steps with Show hint + Reveal solution toggles,
    engineNotes grid, mark complete.
  - Practice: "Everything, shuffled" shows 179; a module card (m01) runs the
    lab-coding drill path.
  - Exams: mock-1 intro (70 min, pass 700) → sitting shows the cs-1 case-study
    panel on the 5 `q-cs1-*` questions → submit → results + review with
    per-domain breakdown; mock-2 (30 ids, 45 min).
  - Compare: 4-entry picker; detail shows 4 engine columns, sample tabs per
    engine, 6 migration cards.
  - Migration round-trip (if not already done in phase 5): seed
    `dp800-store` → refresh → data visible once → refresh → unchanged; SRS
    cards checked in the store (no hub surface renders SRS yet).
  - Themes: Auto / Light / Dark / Night across a lesson, the compare matrix,
    and a lab. The mermaid figure must render as a diagram in all four —
    the `<pre>` fallback appearing anywhere is a BUG (render-id collision or
    init failure), not a theme variant to eyeball.
  - A11y: keyboard nav through practice cards and compare tabs, visible focus,
    reduced-motion respected (contract §8).
- Parity deltas recorded (accepted, not bugs): decision 9 (no lab-coding set
  cards / sourceUrl links); decision 12 (no in-app /setup page — roadmap
  candidate; the donor's "(see the Setup page)" prerequisite string,
  `learn-dp-800/src/content/labs.ts:17`, is amended during extraction to point
  at the bundled `public/dp-800/docker/` environment (documented verbatim
  exception, validation session 1), and the authored safety README inside that
  directory carries the exposure guidance); donor compare→lesson "Full lesson"
  links (`learn-dp-800/src/app/compare/page.tsx:58-60`) not ported — no lesson
  back-ref in the hub Comparison schema, and the lessons→comparison direction
  survives via sideBySide blocks; decision 13 (theme/achievements/streak not
  migrated).

### Non-functional

- No new code beyond the README edit (fixes for anything this phase uncovers
  go back to the owning phase's files, with its owning phase's patterns).
- Bundle numbers and walkthrough results land in the phase report under
  `reports/` — stateful records, not evergreen docs.

## Architecture

Verification-only phase; the README sentence is the single file edit. The
walkthrough exercises the full chain built across phases 1–5:

```
content/dp-800/**  →  glob loader  →  validateSubject  →  registries (7 kinds, phase 2)
                  →  7 mode views  →  subject-store (phase 1 merge + phase 5 import)
docker env: public/dp-800/docker/**  (static-served, verbatim)
```

## Related Code Files

### Create

- `reports/` phase-6 verification notes (walkthrough checklist results, bundle
  numbers) — a report file, not product docs

### Modify

- `README.md` — "Installed packs" sentence + one-time import mention

### Delete

- (none)

## Implementation Steps

1. Run every gate; capture build chunk map + sizes.
2. Verify hub home card + README edit; link-check the README change.
3. Work through the manual checklist; record results + bundle numbers in the
   phase report; fix findings in their owning files (re-running that phase's
   tests) rather than patching here.
4. Confirm donor tree clean and `public/dp-800/docker/` copied files
   byte-identical to the donor `docker/` (the authored safety README is the
   one deliberate extra file).
5. Final full `npm test` + `npm run build` pass; mark the plan phases done via
   `ak plan check`.

## Success Criteria

- [x] All gates green: test / content:check (4 packs) / lint / build /
      extractor dry-run counts; extractor re-run byte-identical
- [x] Mermaid absent from the entry chunk (async chunk only); bundle growth
      recorded
- [x] Hub home shows the dp-800 card; README names DP-800 and the dp-800
      progress import; links valid
- [x] Walkthrough checklist fully checked (incl. 4 themes, a11y pass, compare
      matrix, case-study sitting, lab reveals); findings fixed in owning phases
- [x] `learn-dp-800/` clean; accepted parity deltas recorded in the phase report

## Risk Assessment

| Risk | Break signal | Pre-decided response |
| --- | --- | --- |
| Mermaid lands in the entry bundle (import hoisted by bundler or a stray top-level import) | build chunk map shows mermaid in entry | Fix the import site (figure renderer must hold the only reference, inside the lazy path); if the bundler refuses, accept ONLY with a measured entry-size delta recorded and a follow-up noted — do not silently ship |
| Walkthrough uncovers a renderer bug (layout, theme contrast, broken link) | manual finding | Fix in the owning phase's file (phase 2 renderers / phase 3 extractor) with its unit test extended; re-run this phase's gates |
| README edit overstates scope (drifts into docs churn) | review diff exceeds two sentences | Shrink to the "Installed packs" sentence + import mention — the smallest owning surface per the docs rule |
| A11y pass finds keyboard traps in compare tabs or lab reveals | manual finding | Fix in shared UI (`Compare.tsx` SampleTabs / `LabViewer.tsx` reveal buttons) — contract §8 (themes + a11y apply globally); gh packs re-verified after the fix |
| Late-discovered donor drift invalidates a pin | parity test red here | Re-grep donor source; if it truly changed, update pin + extractor together and re-run phases 3–4 gates; never weaken a pin to pass |
