---
title: "Phase 5: Engines Port"
status: completed
priority: P1
effort: "5h"
dependencies: [4]
---

# Phase 5: Engines Port

## Overview

Port and deduplicate the learning engines into `src/engines/`, and add the
persisted subject-data store on Phase 0's `StorageAdapter`. One implementation
per engine; every port brings its tests. Grading/scoring wait for Phase 6
(they dispatch through the question registry).

## Port Map (authoritative)

| Target `src/engines/…` | Source | Change during port |
|---|---|---|
| `srs.ts` | dp-800 `src/lib/srs.ts` | import paths only (types from `sdk/types`) |
| `streak.ts` | dp-800 `src/lib/streak.ts` | none (already pure) |
| `sampling.ts` | gh-200 `src/utils/sample.ts` | `sampleIds/sampleExam` read unified `Exam.selection.sampled`; mulberry32/shuffleWith verbatim |
| `progress.ts` | dp-800 `src/lib/progress.ts` | `computeStats` takes a `SubjectContent` + subjectId param instead of static curriculum imports; lesson totals per subject |
| `revision.ts` | dp-800 `src/lib/revision.ts` | `buildRevisionPlan(attempts, content, limit)` — content passed in |
| `subject-store.ts` | dp-800 `src/lib/store.ts` + Phase 0 `store.ts` patterns | new `useSubjectDataStore`, see below |
| *(Phase 6)* `scoring.ts` | dp-800 `scoring.ts` + gh-200 `score.ts` | merged after graders exist |
| *not ported* | gh-200 `hooks/useProgress.ts` | superseded — Zustand selectors replace it (Phase 2 consumes) |
| *not ported* | dp-800 `asset.ts`, achievements list | Phase 4 pack work / Phase 6 roadmap |

## Requirements

- [x] `srs.ts` + `srs.test.ts`: Leitner boxes 1..5, intervals `[0,1,2,4,7,15]`, `ingestResults` tracks only-after-first-miss semantics — ported verbatim.
- [x] `streak.ts` + `streak.test.ts`: calendar-day logic ported verbatim.
- [x] `sampling.ts` + `sampling.test.ts`: golden-paper determinism tests re-homed against unified `Exam`/`Question` shapes (gh-200 `sample.test.ts` + `exams.test.ts` sampling block).
- [x] `progress.ts` + tests: `computeStats` generalized (no static content imports); dp-800 test cases re-created against fixture-pack data.
- [x] `revision.ts` + tests: same generalization.
- [x] `subject-store.ts`: `useSubjectDataStore` persisted at key `cc-subject-data` via `createJSONStorage(adapterAsStateStorage(...))` — reuse Phase 0's exact pattern from `src/engines/store.ts` *(separate store confirmed, Validation Session 1)*:
  - shape `{ version: 1, streak: StreakState, subjects: Record<subjectId, SubjectUserData> }` where `SubjectUserData = { lessons, completedLabs, quizAttempts, examAttempts, srs, notes, bookmarks, lastLessonId? }`;
  - actions ported from dp-800's store: `markLesson`, `visitLesson`, `toggleBookmark`, `completeLab`, `upsertNote`, `deleteNote`, `recordQuiz`, `recordExam` — each namespaced: every write goes through `subjects[currentSubjectId]` (subjectId passed to the action, never ambient state);
  - `recordQuiz`/`recordExam` ingest SRS via `ingestResults` and bump the hub-level streak, mirroring dp-800's wiring;
  - theme stays in the Phase 0 store — no duplication.
- [x] Store tests with `createMemoryAdapter()` (Phase 0 pattern): namespacing proven — writes under subject A never touch subject B's slice; persist round-trip via rehydrate.

## Architecture

Engines are pure and subject-blind: every function that needed dp-800's static
curriculum now receives content (or is called through selectors that already
have it). The store is the only stateful engine and deliberately mirrors Phase
0's persist/merge conventions so a future cloud adapter swaps both stores in
one move. Legacy localStorage keys (`learn-dp-800` app keys) are NOT read —
migration shims belong to the pack phases where those users actually exist.

## Related Code Files

- Create: `src/engines/{srs,streak,sampling,progress,revision,subject-store}.ts` + matching `.test.ts`
- Read: `learn-dp-800/src/lib/{srs,streak,progress,revision,store}.ts` + tests, `learn-gh-200/src/utils/sample.ts` + tests, `src/engines/{storage,store}.ts`
- Modify: none existing (additive only)

## Implementation Steps

1. Port the three pure-and-verbatim files first (`srs`, `streak`, `sampling`) with their tests; run.
2. Generalize `progress` + `revision` against the fixture pack's `SubjectContent`; port tests.
3. Build `subject-store.ts` on the Phase 0 persist pattern; write namespacing + round-trip tests.
4. Full `npm test`, `npm run lint`, `npm run build`.

## Todo

- [x] Pure ports (srs/streak/sampling) + tests
- [x] Generalized ports (progress/revision) + tests
- [x] Subject-data store + tests
- [x] Full gate green

## Success Criteria

- [x] All ported tests green; exactly one implementation of each engine exists in `src/`.
- [x] No engine imports from `learn-*`; no engine reads `localStorage` directly (adapter only).
- [x] Namespacing test: interleaved writes to two subject ids leave both slices correct.

## Risk Assessment

- **Persisted-shape churn before real packs exist**: acceptable — no users on `cc-subject-data` yet; `version: 1` field is the migration hook.
- **Store tests flake on rehydrate timing**: signal = store.rehydrate-style tests intermittently fail; response = follow the existing `store.rehydrate.test.ts` seams (they solved this in Phase 0) rather than inventing new await patterns.
