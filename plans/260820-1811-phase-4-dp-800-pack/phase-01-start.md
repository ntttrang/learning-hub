---
phase: 1
title: "Enabling seams"
status: completed
priority: P1
effort: 0.5d
dependencies: []
---

# Phase 1: Enabling seams

## Overview

The three small hub changes every later phase stands on, each independently
testable, none touching pack data yet: (1) the DP-800 renderer registration seam —
an empty `src/content/dp-800/renderers.tsx` side-effect imported by BOTH
`src/App.tsx` and `src/content/content-check.test.ts`, so the seven block kinds
landing in phase 2 are registered in the dev app, inside every App-rendering
test's module graph (`views.test.tsx`, `app-flow.test.tsx`, `App.test.tsx` all
import App; `main.tsx` sits in no test graph), AND inside the content-check
module graph (which never imports the app entry — the trap documented in
[reports/scout-hub-gaps.md](./reports/scout-hub-gaps.md) §2); (2) pretty engine
labels in shared UI — `ENGINE_LABELS` + raw-id fallback used by LabViewer's two
raw-id sites; (3) `importLegacyData` extended from its current 3-key merge
(lessons/completedLabs/examAttempts, `src/engines/subject-store.ts:170-188`) to
the full `SubjectUserData` set the DP-800 donor store carries, hub-wins on
collision, additive so the gh shim (which passes 3 keys) is unaffected.

## Requirements

### Functional

- `src/content/dp-800/renderers.tsx` exists with a module docstring naming its
  contract (registers every DP-800 block kind; kinds land in phase 2) and imports
  nothing yet beyond `registerBlockKind` re-export usage — importing it must be a
  side-effect no-op today.
- `src/App.tsx` and `src/content/content-check.test.ts` both side-effect import
  `'./content/dp-800/renderers'` / `'../content/dp-800/renderers'` respectively.
  One authoritative site (App.tsx, rendered by `main.tsx`) covers the dev app
  and every App-rendering test; the test-file import covers the content-check
  coverage gate, whose module graph excludes the app entry.
- `src/ui/engine-labels.ts` exports `ENGINE_LABELS: Record<string, string>`
  (sqlserver→'Microsoft SQL', postgresql→'PostgreSQL', mysql→'MySQL',
  oracle→'Oracle Database') and `engineLabel(id: string): string` returning the
  label with the raw id as fallback. Plain data module, zero imports — so the
  phase-3 extractor script can import it too without dragging React in.
- `src/ui/LabViewer.tsx` renders `engineLabel(...)` at the two raw-id sites:
  "Runs on:" (`LabViewer.tsx:121`) and the engine-notes grid key
  (`LabViewer.tsx:151`). Unknown ids keep rendering the raw id.
- `importLegacyData(subjectId, partial)` merges, per key, hub-wins /
  skip-if-present, exactly:
  - `lessons`: `{...partial.lessons, ...data.lessons}` (existing, unchanged)
  - `completedLabs`: existing + legacy-not-present (existing, unchanged)
  - `examAttempts`: existing + legacy-not-present-by-id (existing, unchanged)
  - `quizAttempts`: existing first, then legacy entries whose `id` is not present
  - `notes`: hub entries win by id; legacy entries with new ids appended after
  - `bookmarks`: existing order first, then legacy ids not already present
  - `srs`: `{...partial.srs, ...data.srs}` (hub wins per questionId)
  - `lastLessonId`: `data.lastLessonId ?? partial.lastLessonId` (hub wins)
  - Absent partial keys remain a no-op (spread of undefined key must not wipe
    existing data — this is what keeps the gh shim green).

### Non-functional

- No schema, registry, or validator changes. No new dependencies.
- gh-900 / gh-200 / fixture behavior unchanged; their suites stay green.
- The seam import must not affect tree-shaking of the entry bundle beyond an
  empty module (verifiable in phase 6's build output).

## Architecture

Three independent seams, no cross-dependency:

```
main.tsx → App.tsx ─────┐
                       ├─ side-effect import → src/content/dp-800/renderers.tsx
content-check.test.ts ─┘        (registers 7 kinds in phase 2)
(App anchor ⇒ views/app-flow/App test graphs carry registration too)

src/ui/engine-labels.ts  (plain data) ← used by LabViewer now,
                                          dp-800 renderers + extractor later

subject-store.importLegacyData(partial: Partial<SubjectUserData>)
  ← gh shim still passes {lessons, completedLabs, examAttempts} (3 keys, no-op delta)
  ← dp-800 shim (phase 5) passes the full 8-key set
```

## Related Code Files

### Create

- `src/content/dp-800/renderers.tsx` — registration seam (empty this phase)
- `src/ui/engine-labels.ts` — `ENGINE_LABELS` + `engineLabel()` fallback

### Modify

- `src/App.tsx` — add the side-effect import
- `src/content/content-check.test.ts` — add the side-effect import
- `src/ui/LabViewer.tsx` — engineLabel at the two raw-id sites (`:121`, `:151`)
- `src/engines/subject-store.ts` — extend `importLegacyData` (`:170-188`)
- `src/engines/subject-store.test.ts` — full-field merge tests
- `src/ui/LabViewer.test.tsx` — label rendering tests

### Delete

- (none)

## Implementation Steps

1. Create `src/ui/engine-labels.ts`; wire LabViewer's two sites; add LabViewer
   tests (known engine → pretty label; unknown id → raw id fallback).
2. Extend `importLegacyData` per the merge table; extend
   `src/engines/subject-store.test.ts`: each new key merges hub-wins /
   skip-if-present; partial with only the 3 gh keys behaves exactly as before
   (regression pin for the gh shim); empty partial is a no-op.
3. Create `src/content/dp-800/renderers.tsx` (docstring + no registrations);
   add the side-effect imports in `src/App.tsx` and
   `src/content/content-check.test.ts`.
4. Gates: `npm test`, `npm run content:check`, `npm run lint`, `npm run build`.

## Success Criteria

- [x] `src/content/dp-800/renderers.tsx` imported by both `App.tsx` and
      `content-check.test.ts`; `content:check` green (still 3 packs)
- [x] LabViewer shows "Runs on: Microsoft SQL, PostgreSQL, MySQL, Oracle" for
      lab-json's engine list and pretty labels in the engine-notes grid; unknown
      ids fall back to the raw id (unit-tested)
- [x] `importLegacyData` unit tests cover all 8 keys incl. hub-wins collisions,
      the 3-key gh-shaped partial regression, and no-op on empty partial
- [x] `npm test` / `npm run content:check` / `npm run lint` / `npm run build` green

## Risk Assessment

| Risk | Break signal | Pre-decided response |
| --- | --- | --- |
| Side-effect import of a `.tsx` module trips oxlint or tsc in the test/script graphs | lint/tsc failure at step 3 | Keep the module import-free this phase (no React import until phase 2 needs it); if the linter still objects, `// oxlint-disable-next-line import/no-side-effects`-style narrow suppression at the two import sites — never widen config |
| `importLegacyData` extension accidentally mutates keys the gh shim relies on | `migrate-gh-progress.test.ts` or `subject-store.test.ts` red | The 3-key regression pin IS the spec: revert the diverging merge line, not the test |
| LabViewer label change breaks an existing snapshot asserting raw ids | `LabViewer.test.tsx` red | Update the assertion to the label (behavior change is the point); if a test asserts unknown-id fallback it must keep passing |
| engine-labels module grows imports later (breaking script importability) | phase 3 extractor fails to import it | Keep the module dependency-free by contract; move anything richer into the renderers module instead |
